"""
Krishi AI - Flask backend
--------------------------
Serves the static frontend (frontend/) and exposes a single JSON API,
POST /api/diagnose, which sends an uploaded plant photo to Gemini 3.6 Flash
and returns a structured, bilingual (English + Nepali) diagnosis report.

Run with:  python app.py
See ../README.md for full setup instructions.
"""

import base64
import json
import logging
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from google import genai
from google.genai import errors as genai_errors

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

load_dotenv()

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("krishi-ai")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8 MB max upload

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
MODEL_ID = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")

client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
else:
    logger.warning(
        "GEMINI_API_KEY is not set. Copy backend/.env.example to backend/.env "
        "and add your key from https://aistudio.google.com/apikey"
    )

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

# ---------------------------------------------------------------------------
# Gemini prompt + structured output schema
# ---------------------------------------------------------------------------

SYSTEM_INSTRUCTION = """You are Krishi AI, an expert plant pathologist and agronomist who helps \
smallholder farmers in Nepal diagnose crop and garden plant problems from a single photo.

Rules you must always follow:
- Base your diagnosis only on what is visibly present in the photo. Do not invent details.
- If the image does not show a plant (or the plant is too unclear to assess), set "is_plant" to \
false and explain why in "notes", leaving other fields as your best short placeholder.
- If the plant looks healthy with no visible symptoms, set "is_healthy" to true and "severity.level" \
to "Healthy".
- "confidence_score" is your honest confidence (0-100) in the overall diagnosis given image quality \
and visible symptoms. Do not default to round numbers like 90 or 100 unless truly warranted.
- Prefer remedies and inputs that are realistically available to a smallholder farmer in Nepal: \
common agrovet chemical names, and cheap local/home/organic remedies (e.g. neem, ash, soap water, \
cow urine, turmeric, buttermilk) used in South Asian farming.
- Every text field must be written twice: once in clear, simple English ("en") and once in natural, \
simple Nepali using Devanagari script ("ne"). Keep sentences short and practical, written for a \
farmer, not a scientist.
- Always return every field defined in the schema, even for a healthy plant or a non-plant image \
(use short, sensible placeholders like "Not applicable" / "लागू हुँदैन" where appropriate).
- Never include markdown, asterisks, or bullet characters inside text fields; the app renders lists \
itself.
"""

PROMPT_TEXT = """Examine the attached photo of a plant and produce a diagnostic report as JSON \
matching the provided schema.

Include, specifically:
1. The plant's common name (best guess if uncertain).
2. Whether it is healthy or diseased/stressed.
3. If diseased: the most likely disease or disorder, its severity (Mild, Moderate, or Severe based \
on how much of the plant is visibly affected), and your confidence score.
4. The likely cause (fungal, bacterial, viral, pest, nutrient deficiency, or environmental stress).
5. 2-4 chemical remedies (specific, commonly available product/active-ingredient names and simple \
usage guidance) - only if diseased.
6. 2-4 cheap local/home remedies a smallholder farmer could try - only if diseased.
7. 3-5 practical prevention or plant-care tips for the future (relevant whether the plant is healthy \
or diseased).
"""

REPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "is_plant": {"type": "boolean"},
        "is_healthy": {"type": "boolean"},
        "plant_name": {
            "type": "object",
            "properties": {"en": {"type": "string"}, "ne": {"type": "string"}},
            "required": ["en", "ne"],
        },
        "disease_name": {
            "type": "object",
            "properties": {"en": {"type": "string"}, "ne": {"type": "string"}},
            "required": ["en", "ne"],
        },
        "severity": {
            "type": "object",
            "properties": {
                "level": {
                    "type": "string",
                    "enum": ["Healthy", "Mild", "Moderate", "Severe"],
                },
                "en": {"type": "string"},
                "ne": {"type": "string"},
            },
            "required": ["level", "en", "ne"],
        },
        "confidence_score": {"type": "integer"},
        "cause": {
            "type": "object",
            "properties": {"en": {"type": "string"}, "ne": {"type": "string"}},
            "required": ["en", "ne"],
        },
        "chemical_remedies": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"en": {"type": "string"}, "ne": {"type": "string"}},
                "required": ["en", "ne"],
            },
        },
        "local_remedies": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"en": {"type": "string"}, "ne": {"type": "string"}},
                "required": ["en", "ne"],
            },
        },
        "prevention": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"en": {"type": "string"}, "ne": {"type": "string"}},
                "required": ["en", "ne"],
            },
        },
        "notes": {
            "type": "object",
            "properties": {"en": {"type": "string"}, "ne": {"type": "string"}},
            "required": ["en", "ne"],
        },
    },
    "required": [
        "is_plant",
        "is_healthy",
        "plant_name",
        "disease_name",
        "severity",
        "confidence_score",
        "cause",
        "chemical_remedies",
        "local_remedies",
        "prevention",
        "notes",
    ],
}

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "model": MODEL_ID, "model_configured": client is not None})


@app.route("/api/diagnose", methods=["POST"])
def diagnose():
    if client is None:
        return (
            jsonify(
                {
                    "error": "server_not_configured",
                    "message": "The server is missing a GEMINI_API_KEY. See backend/.env.example.",
                }
            ),
            500,
        )

    if "image" not in request.files:
        return jsonify({"error": "no_image", "message": "No image file was uploaded."}), 400

    file = request.files["image"]
    if not file or file.filename == "":
        return jsonify({"error": "no_image", "message": "No image file was selected."}), 400

    mime_type = (file.mimetype or "").lower()
    if mime_type not in ALLOWED_MIME_TYPES:
        return (
            jsonify(
                {
                    "error": "unsupported_type",
                    "message": "Unsupported image type. Please upload a JPEG, PNG, or WEBP photo.",
                }
            ),
            400,
        )

    image_bytes = file.read()
    if not image_bytes:
        return jsonify({"error": "empty_file", "message": "The uploaded file is empty."}), 400

    encoded_image = base64.b64encode(image_bytes).decode("utf-8")

    try:
        interaction = client.interactions.create(
            model=MODEL_ID,
            system_instruction=SYSTEM_INSTRUCTION,
            input=[
                {"type": "text", "text": PROMPT_TEXT},
                {"type": "image", "data": encoded_image, "mime_type": mime_type},
            ],
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": REPORT_SCHEMA,
            },
        )
    except genai_errors.APIError as exc:
        logger.exception("Gemini API error")
        return (
            jsonify({"error": "model_error", "message": f"The AI model returned an error: {exc}"}),
            502,
        )
    except Exception as exc:  # noqa: BLE001 - surface any unexpected failure safely
        logger.exception("Unexpected error while calling Gemini")
        return jsonify({"error": "model_error", "message": "Could not reach the AI model."}), 502

    raw_text = getattr(interaction, "output_text", None)
    if not raw_text:
        return jsonify({"error": "empty_response", "message": "The model returned an empty response."}), 502

    try:
        report = json.loads(raw_text)
    except json.JSONDecodeError:
        logger.error("Could not parse model output as JSON: %s", raw_text)
        return jsonify({"error": "parse_error", "message": "Could not parse the model's response."}), 502

    return jsonify({"report": report})


@app.errorhandler(413)
def handle_too_large(_exc):
    return (
        jsonify({"error": "file_too_large", "message": "Image is too large. Please upload a file under 8 MB."}),
        413,
    )


@app.errorhandler(404)
def handle_not_found(exc):
    if request.path.startswith("/api/"):
        return jsonify({"error": "not_found", "message": "Unknown API endpoint."}), 404
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    logger.info("Krishi AI starting on http://localhost:%s (model=%s)", port, MODEL_ID)
    app.run(host="0.0.0.0", port=port, debug=debug)
