# Krishi AI

Photograph a diseased plant and get an instant, bilingual (English / Nepali) diagnosis report:
plant name, disease, severity, confidence score, cause, chemical remedies, cheap local remedies,
and prevention tips.

- **Frontend:** plain HTML + Tailwind CSS (CDN) + custom CSS + vanilla JS — no build step.
- **Backend:** Flask, calling Google's **Gemini 3.6 Flash** (`gemini-3.6-flash`) with structured
  JSON output.

```
krishi-ai/
├── backend/
│   ├── app.py            # Flask server + Gemini call + /api/diagnose
│   ├── requirements.txt
│   └── .env.example      # copy to .env and add your API key
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── translations.js   # static UI text (EN/NE)
│   └── app.js
└── README.md
```

The Flask app serves the `frontend/` folder directly, so there's only **one server to run**
and no CORS setup needed.

## 1. Prerequisites

- Python 3.9 or newer
- A free Gemini API key from **https://aistudio.google.com/apikey**

## 2. Get the code onto your machine

Unzip the project (or `git clone` it if you put it in a repo), then open a terminal in the
`krishi-ai/` folder.

## 3. Set up the backend

```bash
cd backend

# create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# install dependencies
pip install -r requirements.txt

# add your API key
cp .env.example .env            # Windows: copy .env.example .env
```

Open the new `.env` file and paste your key:

```
GEMINI_API_KEY=your_actual_key_here
```

## 4. Run the app

Still inside `backend/`:

```bash
python app.py
```

You should see:

```
Krishi AI starting on http://localhost:5000 (model=gemini-3.6-flash)
```

Open **http://localhost:5000** in your browser (or your phone, if it's on the same network —
use your computer's local IP instead of `localhost`).

## 5. Using it

1. Tap/click the upload area to choose a photo, or drag one in (on a phone, this opens the
   camera directly).
2. Click **Diagnose plant**.
3. Read the report. Use the **EN / ने** toggle in the header to switch the entire page —
   including the AI-generated report — between English and Nepali.
4. Click **New scan** to check another plant.

## Notes & troubleshooting

- **"The server is missing a GEMINI_API_KEY"** — you skipped step 3, or `.env` isn't in the
  `backend/` folder next to `app.py`.
- **Nothing loads at `localhost:5000`** — make sure `python app.py` is still running in the
  terminal, and that nothing else is using port 5000 (change it with `PORT=5050` in `.env`
  if needed).
- **Slow or failed diagnosis** — this calls Google's API over the internet; check your
  connection, and check the terminal running `app.py` for the exact error.
- **Model name** — Gemini 3.6 Flash is configured in `backend/app.py` /
  `backend/.env` (`GEMINI_MODEL`). Change it there if you'd rather use another Gemini model.
- This tool gives an **AI-generated estimate**, not professional agronomic advice. For high-value
  crops or uncertain cases, confirm with a local agrovet or agricultural extension office before
  applying any chemical.
