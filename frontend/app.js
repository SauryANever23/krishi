// Krishi AI — frontend logic
// Handles: image upload/preview, calling POST /api/diagnose, rendering the
// bilingual report, and switching the whole page between English and Nepali.

(function () {
  "use strict";

  const MAX_FILE_BYTES = 8 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  // ---- State ----------------------------------------------------------
  let currentLang = localStorage.getItem("krishi-lang") || "en";
  let selectedFile = null;
  let currentReport = null; // last successful report from the backend

  // ---- Element refs -----------------------------------------------------
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const dropzoneEmpty = document.getElementById("dropzone-empty");
  const dropzonePreview = document.getElementById("dropzone-preview");
  const previewImg = document.getElementById("preview-img");
  const scanOverlay = document.getElementById("scan-overlay");

  const diagnoseBtn = document.getElementById("diagnose-btn");
  const resetBtn = document.getElementById("reset-btn");
  const analyzingLabel = document.getElementById("analyzing-label");
  const errorBanner = document.getElementById("error-banner");

  const noticeSection = document.getElementById("notice-section");
  const noticeText = document.getElementById("notice-text");
  const reportSection = document.getElementById("report-section");

  const reportPlantName = document.getElementById("report-plant-name");
  const reportDiseaseName = document.getElementById("report-disease-name");
  const severityBadge = document.getElementById("severity-badge");
  const confidenceValue = document.getElementById("confidence-value");
  const confidenceFill = document.getElementById("confidence-fill");

  const healthyBanner = document.getElementById("healthy-banner");
  const diseaseGrid = document.getElementById("disease-grid");
  const healthyPreventionCard = document.getElementById("healthy-prevention-card");

  const reportCause = document.getElementById("report-cause");
  const reportChemical = document.getElementById("report-chemical");
  const reportLocal = document.getElementById("report-local");
  const reportPrevention = document.getElementById("report-prevention");
  const reportPreventionHealthy = document.getElementById("report-prevention-healthy");
  const reportNotes = document.getElementById("report-notes");

  // ---- i18n ---------------------------------------------------------

  function applyTranslations(lang) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("data-lang", lang);
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      const active = btn.getAttribute("data-lang-btn") === lang;
      btn.classList.toggle("lang-btn--active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function t(key) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  }

  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentLang = btn.getAttribute("data-lang-btn");
      localStorage.setItem("krishi-lang", currentLang);
      applyTranslations(currentLang);
      if (currentReport) renderReport(currentReport);
    });
  });

  applyTranslations(currentLang);

  // ---- Error banner -----------------------------------------------------

  function showError(messageKey) {
    errorBanner.textContent = t(messageKey);
    errorBanner.classList.remove("hidden");
  }

  function clearError() {
    errorBanner.textContent = "";
    errorBanner.classList.add("hidden");
  }

  // ---- File selection & preview -----------------------------------------

  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.setAttribute("tabindex", "0");
  dropzone.setAttribute("role", "button");
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("dropzone--drag");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("dropzone--drag");
    })
  );
  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) handleFile(file);
  });

  function handleFile(file) {
    clearError();

    if (!ALLOWED_TYPES.includes(file.type)) {
      showError("error_file_type");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      showError("error_file_size");
      return;
    }

    selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      dropzoneEmpty.classList.add("hidden");
      dropzonePreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);

    diagnoseBtn.disabled = false;
    hideResults();
  }

  // ---- Diagnose ---------------------------------------------------------

  diagnoseBtn.addEventListener("click", async () => {
    if (!selectedFile) {
      showError("error_no_image");
      return;
    }

    clearError();
    hideResults();
    setLoading(true);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const res = await fetch("/api/diagnose", { method: "POST", body: formData });
      let payload;
      try {
        payload = await res.json();
      } catch (_e) {
        throw new Error("bad_json");
      }

      if (!res.ok) {
        showError("error_generic");
        setLoading(false);
        return;
      }

      currentReport = payload.report;
      renderReport(currentReport);
    } catch (_err) {
      showError("error_network");
    } finally {
      setLoading(false);
    }
  });

  resetBtn.addEventListener("click", () => {
    selectedFile = null;
    currentReport = null;
    fileInput.value = "";
    previewImg.src = "";
    dropzoneEmpty.classList.remove("hidden");
    dropzonePreview.classList.add("hidden");
    diagnoseBtn.disabled = true;
    resetBtn.classList.add("hidden");
    clearError();
    hideResults();
  });

  function setLoading(isLoading) {
    diagnoseBtn.disabled = isLoading || !selectedFile;
    analyzingLabel.classList.toggle("hidden", !isLoading);
    analyzingLabel.classList.toggle("flex", isLoading);
    scanOverlay.classList.toggle("hidden", !isLoading);
  }

  function hideResults() {
    noticeSection.classList.add("hidden");
    reportSection.classList.add("hidden");
  }

  // ---- Render report ------------------------------------------------------

  function renderReport(report) {
    resetBtn.classList.remove("hidden");

    if (!report.is_plant) {
      hideResults();
      noticeSection.classList.remove("hidden");
      noticeText.textContent = (report.notes && report.notes[currentLang]) || "";
      noticeSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    noticeSection.classList.add("hidden");
    reportSection.classList.remove("hidden");

    reportPlantName.textContent = safe(report.plant_name);
    reportDiseaseName.textContent = report.is_healthy ? t("healthy_title") : safe(report.disease_name);

    const level = (report.severity && report.severity.level) || "Healthy";
    severityBadge.textContent = report.severity ? safe(report.severity) : level;
    severityBadge.className = "severity-badge " + severityClass(level);

    const confidence = clamp(Number(report.confidence_score) || 0, 0, 100);
    confidenceValue.textContent = confidence + "%";
    confidenceFill.style.width = confidence + "%";

    if (report.is_healthy) {
      healthyBanner.classList.remove("hidden");
      diseaseGrid.classList.add("hidden");
      healthyPreventionCard.classList.remove("hidden");
      fillList(reportPreventionHealthy, report.prevention);
    } else {
      healthyBanner.classList.add("hidden");
      diseaseGrid.classList.remove("hidden");
      healthyPreventionCard.classList.add("hidden");

      reportCause.textContent = safe(report.cause);
      fillList(reportChemical, report.chemical_remedies);
      fillList(reportLocal, report.local_remedies);
      fillList(reportPrevention, report.prevention);
    }

    const notes = report.notes && report.notes[currentLang];
    if (notes && notes.trim()) {
      reportNotes.textContent = notes;
      reportNotes.classList.remove("hidden");
    } else {
      reportNotes.classList.add("hidden");
    }

    reportSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function fillList(ulEl, items) {
    ulEl.innerHTML = "";
    (items || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = safe(item);
      ulEl.appendChild(li);
    });
  }

  function safe(bilingualField) {
    if (!bilingualField) return "";
    return bilingualField[currentLang] || bilingualField.en || "";
  }

  function severityClass(level) {
    switch (level) {
      case "Mild":
        return "severity-badge--mild";
      case "Moderate":
        return "severity-badge--moderate";
      case "Severe":
        return "severity-badge--severe";
      default:
        return "severity-badge--healthy";
    }
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }
})();
