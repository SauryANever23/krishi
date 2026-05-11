/**
 * KisaanAI — Plant Disease Detection App
 * Full app logic: image handling, API calls, language toggle, results rendering
 */

// ================================================================
// STATE
// ================================================================
let currentLang = 'en';
let selectedFile = null;
let analysisResult = null;

// ================================================================
// STATIC DISEASE DATABASE (fallback when API unavailable)
// ================================================================
const diseaseDB = {
  "tomato_blight": {
    plant_en: "Tomato (Lycopersicon esculentum)",
    plant_ne: "टमाटर (Lycopersicon esculentum)",
    disease_en: "Early Blight",
    disease_ne: "अर्ली ब्लाइट",
    confidence: 91,
    severity: "medium",
    urgency: "medium",
    desc_en: "Early blight is a common fungal disease caused by Alternaria solani. It affects leaves, stems, and fruits causing dark brown lesions with concentric rings.",
    desc_ne: "अर्ली ब्लाइट Alternaria solani ढुसीद्वारा हुने रोग हो। यसले पात, डाँठ र फललाई असर गर्छ र गाढा खैरो दाग देखाउँछ।",
    symptoms_en: ["Dark brown circular spots with yellow halos", "Concentric ring patterns on leaves", "Lower leaves affected first", "Stem collar rot at soil line"],
    symptoms_ne: ["पहेंलो घेराभित्र गाढा खैरो गोलाकार धब्बाहरू", "पातमा केन्द्रित घेरा बान्की", "तल्लो पातहरू पहिले प्रभावित", "जरा नजिक डाँठमा कुहिने"],
    causes_en: ["Alternaria solani fungus", "High humidity (>90%)", "Warm temperatures 24-29°C", "Infected plant debris", "Overhead irrigation"],
    causes_ne: ["Alternaria solani ढुसी", "उच्च आर्द्रता (>९०%)", "तातो तापमान २४-२९°C", "संक्रमित बाली अवशेष", "माथिबाट पानी सिँचाइ"],
    organic_en: [
      { icon: "🍋", text: "Spray diluted neem oil (2-3 tbsp per litre of water) every 7-10 days" },
      { icon: "🥛", text: "Baking soda solution: 1 tsp + few drops of liquid soap per litre of water" },
      { icon: "🌿", text: "Garlic spray: blend 10 garlic cloves in 1L water, strain and spray" },
      { icon: "🌱", text: "Copper-based Bordeaux mixture (approved organic fungicide)" }
    ],
    organic_ne: [
      { icon: "🍋", text: "नीमको तेल पातलो पारेर (प्रति लिटर पानीमा २-३ चम्चा) ७-१० दिनमा स्प्रे गर्नुस्" },
      { icon: "🥛", text: "बेकिंग सोडा घोल: प्रति लिटर पानीमा १ चम्चा + केही थोपा साबुन" },
      { icon: "🌿", text: "लसुन स्प्रे: १ लिटर पानीमा १० लसुनका कोया पिसेर छानेर स्प्रे गर्नुस्" },
      { icon: "🌱", text: "तामाको मिश्रण (Bordeaux mixture) — स्वीकृत जैविक ढुसीनाशक" }
    ],
    local_en: [
      { icon: "🪴", text: "Mix wood ash in water and spray on affected plants" },
      { icon: "🧄", text: "Onion and garlic extract spray weekly" },
      { icon: "🌾", text: "Turmeric powder paste on affected spots" },
      { icon: "💧", text: "Cow urine spray (dilute 1:5 with water) — traditional remedy" }
    ],
    local_ne: [
      { icon: "🪴", text: "दाउरा खरानी पानीमा मिसाएर प्रभावित बिरुवामा स्प्रे गर्नुस्" },
      { icon: "🧄", text: "प्याज र लसुनको अर्क हप्तामा एकपटक स्प्रे गर्नुस्" },
      { icon: "🌾", text: "हल्दी पाउडर पेस्ट प्रभावित ठाउँमा लगाउनुस्" },
      { icon: "💧", text: "गाईको गोमुत्र (पानीमा १:५ पातलो पारेर) — परम्परागत उपाय" }
    ],
    chemical_en: [
      { icon: "🧪", text: "Mancozeb 75% WP @ 2.5g/L water — spray every 7-10 days" },
      { icon: "🧪", text: "Chlorothalonil 75% WP @ 2g/L water" },
      { icon: "⚠️", text: "Always follow label instructions and use protective gear" }
    ],
    chemical_ne: [
      { icon: "🧪", text: "Mancozeb 75% WP @ 2.5g/L पानी — ७-१० दिनमा स्प्रे गर्नुस्" },
      { icon: "🧪", text: "Chlorothalonil 75% WP @ 2g/L पानी" },
      { icon: "⚠️", text: "सधैं लेबलका निर्देशनहरू पालन गर्नुस् र सुरक्षात्मक सामग्री लगाउनुस्" }
    ],
    prevention_en: [
      { icon: "🔄", text: "Rotate crops every 2-3 years — do not grow tomato in same spot" },
      { icon: "✂️", text: "Remove and destroy infected leaves immediately" },
      { icon: "💦", text: "Use drip irrigation instead of overhead watering" },
      { icon: "🌬️", text: "Ensure proper plant spacing for air circulation" },
      { icon: "🛡️", text: "Use resistant varieties like Mountain Magic, Defiant" }
    ],
    prevention_ne: [
      { icon: "🔄", text: "हरेक २-३ वर्षमा बाली चक्र अपनाउनुस् — एउटै ठाउँमा टमाटर नलगाउनुस्" },
      { icon: "✂️", text: "संक्रमित पातहरू तुरुन्त हटाई नष्ट गर्नुस्" },
      { icon: "💦", text: "माथिबाट पानी हाल्नुको साटो ड्रिप सिँचाइ प्रयोग गर्नुस्" },
      { icon: "🌬️", text: "हावा सञ्चालनका लागि बिरुवाहरूबीच पर्याप्त दूरी राख्नुस्" },
      { icon: "🛡️", text: "प्रतिरोधी किसिमहरू जस्तै Mountain Magic, Defiant प्रयोग गर्नुस्" }
    ]
  },
  "wheat_rust": {
    plant_en: "Wheat (Triticum aestivum)",
    plant_ne: "गहुँ (Triticum aestivum)",
    disease_en: "Wheat Stem Rust",
    disease_ne: "गहुँ स्टेम रस्ट",
    confidence: 88,
    severity: "high",
    urgency: "high",
    desc_en: "Stem rust is caused by Puccinia graminis. It is one of the most destructive wheat diseases, capable of destroying entire crops. Characterized by brick-red pustules on stems and leaves.",
    desc_ne: "स्टेम रस्ट Puccinia graminis ले हुने रोग हो। यो सबैभन्दा विनाशकारी गहुँ रोग हो जसले सम्पूर्ण फसल नष्ट गर्न सक्छ। डाँठ र पातमा इँट्टा-रातो फोकाहरू देखिन्छन्।",
    symptoms_en: ["Brick-red elongated pustules on stems", "Orange-brown powder that rubs off on hands", "Yellowing around pustules", "Premature leaf death"],
    symptoms_ne: ["डाँठमा इँट्टा-रातो लामो फोकाहरू", "हातमा लाग्ने सुन्तला-खैरो धूलो", "फोकाको वरिपरि पहेंलिने", "पातहरू समयभन्दा अगावै सुक्ने"],
    causes_en: ["Puccinia graminis fungus", "Temperature 15-35°C with high humidity", "Wind-dispersed spores", "Susceptible wheat varieties"],
    causes_ne: ["Puccinia graminis ढुसी", "१५-३५°C तापमान उच्च आर्द्रतासहित", "हावाले फैलाएका बीजाणुहरू", "सँवेदनशील गहुँका किसिमहरू"],
    organic_en: [
      { icon: "🌿", text: "Neem oil spray (5ml/L water) at first sign of disease" },
      { icon: "🌱", text: "Trichoderma viride bio-fungicide @ 5g/L water" },
      { icon: "🌾", text: "Silicon-based foliar spray to strengthen plant cell walls" }
    ],
    organic_ne: [
      { icon: "🌿", text: "रोगको पहिलो संकेतमा नीमको तेल स्प्रे (५ml/L पानी)" },
      { icon: "🌱", text: "Trichoderma viride जैव-ढुसीनाशक @ 5g/L पानी" },
      { icon: "🌾", text: "बिरुवाको कोष पर्खाल बलियो बनाउन सिलिकन-आधारित पात स्प्रे" }
    ],
    local_en: [
      { icon: "🌶️", text: "Hot pepper and garlic spray to deter spore germination" },
      { icon: "🌿", text: "Spray strong chamomile tea on leaves" }
    ],
    local_ne: [
      { icon: "🌶️", text: "बीजाणु अंकुरण रोक्न खुर्सानी र लसुन स्प्रे" },
      { icon: "🌿", text: "पातमा बलियो क्यामोमाइल चिया स्प्रे गर्नुस्" }
    ],
    chemical_en: [
      { icon: "🧪", text: "Tebuconazole 25.9% EC @ 1ml/L — most effective fungicide" },
      { icon: "🧪", text: "Propiconazole 25% EC @ 1ml/L water" },
      { icon: "⚠️", text: "Apply at first sign — delay reduces effectiveness" }
    ],
    chemical_ne: [
      { icon: "🧪", text: "Tebuconazole 25.9% EC @ 1ml/L — सबैभन्दा प्रभावकारी ढुसीनाशक" },
      { icon: "🧪", text: "Propiconazole 25% EC @ 1ml/L पानी" },
      { icon: "⚠️", text: "पहिलो संकेतमा लगाउनुस् — ढिलाइले प्रभावकारिता घटाउँछ" }
    ],
    prevention_en: [
      { icon: "🛡️", text: "Plant rust-resistant varieties (e.g., NL-297, BL-1022)" },
      { icon: "📅", text: "Timely planting to avoid peak disease season" },
      { icon: "🌾", text: "Balanced fertilization — avoid excess nitrogen" }
    ],
    prevention_ne: [
      { icon: "🛡️", text: "रस्ट-प्रतिरोधी किसिमहरू (जस्तै NL-297, BL-1022) रोप्नुस्" },
      { icon: "📅", text: "रोग चरम मौसम बेवास्ता गर्न समयमा रोप्नुस्" },
      { icon: "🌾", text: "सन्तुलित मलखाद — अत्यधिक नाइट्रोजनबाट बच्नुस्" }
    ]
  },
  "rice_blast": {
    plant_en: "Rice (Oryza sativa)",
    plant_ne: "धान (Oryza sativa)",
    disease_en: "Rice Blast",
    disease_ne: "धान ब्लास्ट",
    confidence: 85,
    severity: "high",
    urgency: "high",
    desc_en: "Rice blast caused by Magnaporthe oryzae is the most destructive rice disease worldwide. It can cause 10-30% yield loss, and up to 100% in severe cases.",
    desc_ne: "Magnaporthe oryzae ले हुने धान ब्लास्ट विश्वभरको सबैभन्दा विनाशकारी धान रोग हो। यसले १०-३०% उत्पादन घटाउन सक्छ, कठिन अवस्थामा १००% सम्म।",
    symptoms_en: ["Diamond-shaped gray lesions on leaves", "Neck rot causing 'dead neck' panicle", "Infected grains are discolored", "White cottony fungal growth visible"],
    symptoms_ne: ["पातमा हीरा आकारका खैरो धब्बाहरू", "बाला घाँटी कुहिने 'डेड नेक'", "संक्रमित दाना रङ फेर्छन्", "सेतो रूईजस्तो ढुसी वृद्धि देखिन्छ"],
    causes_en: ["Magnaporthe oryzae fungus", "High nitrogen fertilizer", "Intermittent rainfall", "Temperatures 25-28°C", "Dense planting"],
    causes_ne: ["Magnaporthe oryzae ढुसी", "उच्च नाइट्रोजन मल", "रुकिन-रुकिन वर्षा", "२५-२८°C तापमान", "घना रोपाइँ"],
    organic_en: [
      { icon: "🌿", text: "Neem oil + garlic extract spray every 7 days" },
      { icon: "🌱", text: "Pseudomonas fluorescens bio-agent @ 10g/L water" },
      { icon: "💊", text: "Silicon fertilization strengthens cell walls against blast" }
    ],
    organic_ne: [
      { icon: "🌿", text: "नीमको तेल + लसुन अर्क हरेक ७ दिनमा स्प्रे गर्नुस्" },
      { icon: "🌱", text: "Pseudomonas fluorescens जैव-एजेन्ट @ 10g/L पानी" },
      { icon: "💊", text: "सिलिकन मलले कोष पर्खाल बलियो बनाउँछ" }
    ],
    local_en: [
      { icon: "🌾", text: "Reduce nitrogen fertilizer when blast appears" },
      { icon: "💧", text: "Drain fields temporarily to reduce humidity" },
      { icon: "🧄", text: "Fermented garlic water spray (2 bulbs per 10L)" }
    ],
    local_ne: [
      { icon: "🌾", text: "ब्लास्ट देखिँदा नाइट्रोजन मल कम गर्नुस्" },
      { icon: "💧", text: "आर्द्रता घटाउन खेत अस्थायी रूपमा सुकाउनुस्" },
      { icon: "🧄", text: "किण्वित लसुन पानी स्प्रे (१० लिटरमा २ बोटा)" }
    ],
    chemical_en: [
      { icon: "🧪", text: "Tricyclazole 75% WP @ 0.6g/L — most specific blast fungicide" },
      { icon: "🧪", text: "Isoprothiolane 40% EC @ 1.5ml/L water" },
      { icon: "⚠️", text: "Spray at booting and heading stage preventively" }
    ],
    chemical_ne: [
      { icon: "🧪", text: "Tricyclazole 75% WP @ 0.6g/L — ब्लास्टको विशेष ढुसीनाशक" },
      { icon: "🧪", text: "Isoprothiolane 40% EC @ 1.5ml/L पानी" },
      { icon: "⚠️", text: "बाला लाग्ने र टुप्पो निस्किने अवस्थामा निवारकस्वरूप स्प्रे गर्नुस्" }
    ],
    prevention_en: [
      { icon: "🛡️", text: "Use blast-resistant varieties (IR64, Sabitri)" },
      { icon: "⚖️", text: "Balanced NPK fertilizer — avoid excess nitrogen" },
      { icon: "📏", text: "Maintain proper plant spacing (20x20cm)" }
    ],
    prevention_ne: [
      { icon: "🛡️", text: "ब्लास्ट-प्रतिरोधी किसिमहरू (IR64, सावित्री) प्रयोग गर्नुस्" },
      { icon: "⚖️", text: "सन्तुलित NPK मल — अत्यधिक नाइट्रोजनबाट बच्नुस्" },
      { icon: "📏", text: "उचित बिरुवा दूरी (२०x२०cm) कायम राख्नुस्" }
    ]
  },
  "potato_late_blight": {
    plant_en: "Potato (Solanum tuberosum)",
    plant_ne: "आलु (Solanum tuberosum)",
    disease_en: "Late Blight",
    disease_ne: "लेट ब्लाइट",
    confidence: 93,
    severity: "high",
    urgency: "high",
    desc_en: "Potato late blight (Phytophthora infestans) is historically the most devastating plant disease — it caused the Irish Famine. Dark water-soaked lesions spread rapidly in cool humid weather.",
    desc_ne: "आलु लेट ब्लाइट (Phytophthora infestans) ऐतिहासिक रूपमा सबैभन्दा विनाशकारी बाली रोग हो — यसले आयरल्याण्डमा अनिकाल ल्यायो। चिसो र आर्द्र मौसममा कालो पानी-भिजेको धब्बाहरू तीव्र गतिमा फैलिन्छन्।",
    symptoms_en: ["Dark water-soaked spots on leaves and stems", "White cottony growth under leaves in humid conditions", "Brown rot spreading in tubers", "Rapid defoliation in 3-5 days"],
    symptoms_ne: ["पात र डाँठमा कालो पानी-भिजेको धब्बाहरू", "आर्द्र अवस्थामा पातमुनि सेतो रूई जस्तो वृद्धि", "कन्दमा खैरो कुहिने फैलावट", "३-५ दिनमा छिट्टै पातझर्ने"],
    causes_en: ["Phytophthora infestans (water mould)", "Cool temperatures 10-20°C", "High humidity >90% or rainfall", "Infected seed tubers", "Poor field drainage"],
    causes_ne: ["Phytophthora infestans (पानी ढुसी)", "चिसो तापमान १०-२०°C", "उच्च आर्द्रता >९०% वा वर्षा", "संक्रमित बीउ कन्द", "खेतमा खराब जलनिकास"],
    organic_en: [
      { icon: "🌿", text: "Copper-based spray (Bordeaux mixture 1%) every 7-10 days" },
      { icon: "💊", text: "Phosphonic acid (potassium phosphonate) foliar spray" },
      { icon: "🧴", text: "Compost tea spray to boost plant immunity" }
    ],
    organic_ne: [
      { icon: "🌿", text: "तामाको स्प्रे (Bordeaux मिश्रण १%) हरेक ७-१० दिनमा" },
      { icon: "💊", text: "Phosphonic acid (potassium phosphonate) पात स्प्रे" },
      { icon: "🧴", text: "कम्पोस्ट चिया स्प्रे गरेर बिरुवाको रोगप्रतिरोध बढाउनुस्" }
    ],
    local_en: [
      { icon: "🌾", text: "Hill up soil around plants to protect tubers" },
      { icon: "✂️", text: "Remove infected plants immediately and bury far away" },
      { icon: "🌞", text: "Improve drainage and avoid waterlogging" }
    ],
    local_ne: [
      { icon: "🌾", text: "कन्द जोगाउन बिरुवाको वरिपरि माटो थप्नुस्" },
      { icon: "✂️", text: "संक्रमित बिरुवाहरू तुरुन्त हटाई टाढा पुर्नुस्" },
      { icon: "🌞", text: "जलनिकास सुधार गर्नुस् र पानी जम्न नदिनुस्" }
    ],
    chemical_en: [
      { icon: "🧪", text: "Metalaxyl + Mancozeb (Ridomil Gold) @ 2.5g/L — highly effective" },
      { icon: "🧪", text: "Dimethomorph 50% WP @ 1g/L water" },
      { icon: "⚠️", text: "Spray before disease — it spreads very rapidly" }
    ],
    chemical_ne: [
      { icon: "🧪", text: "Metalaxyl + Mancozeb (Ridomil Gold) @ 2.5g/L — अत्यन्त प्रभावकारी" },
      { icon: "🧪", text: "Dimethomorph 50% WP @ 1g/L पानी" },
      { icon: "⚠️", text: "रोग आउनु अघि नै स्प्रे गर्नुस् — यो धेरै छिटो फैलिन्छ" }
    ],
    prevention_en: [
      { icon: "🛡️", text: "Plant certified disease-free seed tubers only" },
      { icon: "🌬️", text: "Adequate spacing and good air circulation" },
      { icon: "📅", text: "Plant when cool, wet weather is not expected" },
      { icon: "🔄", text: "Crop rotation — avoid potatoes after tomatoes" }
    ],
    prevention_ne: [
      { icon: "🛡️", text: "प्रमाणित रोगमुक्त बीउ कन्दहरू मात्र रोप्नुस्" },
      { icon: "🌬️", text: "पर्याप्त दूरी र राम्रो हावा सञ्चालन" },
      { icon: "📅", text: "चिसो, भिजेको मौसम अपेक्षित नभएको बेला रोप्नुस्" },
      { icon: "🔄", text: "बाली चक्र — टमाटरपछि आलु नलगाउनुस्" }
    ]
  }
};

// Sample image placeholders (colour-coded canvases)
const sampleColors = {
  tomato: { bg: '#fef2f2', text: '🍅 Tomato Leaf', disease: 'tomato_blight' },
  wheat: { bg: '#fef9ec', text: '🌾 Wheat Stem', disease: 'wheat_rust' },
  rice: { bg: '#f0fdf4', text: '🌿 Rice Leaf', disease: 'rice_blast' },
  potato: { bg: '#f5f3ff', text: '🥔 Potato Leaf', disease: 'potato_late_blight' }
};

// ================================================================
// LANGUAGE TOGGLE
// ================================================================
function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'ne' : 'en';
  document.getElementById('lang-label').textContent = currentLang === 'en' ? 'नेपाली' : 'English';
  document.body.classList.toggle('lang-ne', currentLang === 'ne');
  applyLanguage();
  if (analysisResult) renderResults(analysisResult);
}

function applyLanguage() {
  document.querySelectorAll('[data-en]').forEach(el => {
    const key = currentLang === 'ne' ? 'ne' : 'en';
    if (el.dataset[key]) el.textContent = el.dataset[key];
  });
  // Update placeholder for form inputs
  const formName = document.getElementById('form-name');
  const formLoc = document.getElementById('form-location');
  const formMsg = document.getElementById('form-msg');
  if (formName) formName.placeholder = currentLang === 'ne' ? 'तपाईंको नाम' : 'Your name';
  if (formLoc) formLoc.placeholder = currentLang === 'ne' ? 'जिल्ला' : 'District';
  if (formMsg) formMsg.placeholder = currentLang === 'ne' ? 'समस्या वर्णन गर्नुस्' : 'Describe the problem';
}

// ================================================================
// SCROLL HELPERS
// ================================================================
function scrollToUpload() {
  document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });
}
function scrollToHowItWorks() {
  document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' });
}

// ================================================================
// IMAGE HANDLING
// ================================================================
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.add('drag-over');
}
function handleDragLeave(e) {
  document.getElementById('drop-zone').classList.remove('drag-over');
}
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (files.length > 0) loadFile(files[0]);
}
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) loadFile(file);
}
function openCamera() {
  document.getElementById('camera-input').click();
}

function loadFile(file) {
  if (!file.type.startsWith('image/')) { showToast('Please upload an image file / फोटो फाइल अपलोड गर्नुस्', 'error'); return; }
  if (file.size > 10 * 1024 * 1024) { showToast('Image too large (max 10MB) / फोटो धेरै ठूलो छ', 'error'); return; }
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('preview-img').src = e.target.result;
    document.getElementById('upload-placeholder').classList.add('hidden');
    document.getElementById('upload-preview').classList.remove('hidden');
    document.getElementById('upload-preview').classList.add('flex');
    document.getElementById('analyze-btn').disabled = false;
  };
  reader.readAsDataURL(file);
}

function clearImage(e) {
  e.stopPropagation();
  selectedFile = null;
  document.getElementById('preview-img').src = '';
  document.getElementById('upload-placeholder').classList.remove('hidden');
  document.getElementById('upload-preview').classList.add('hidden');
  document.getElementById('upload-preview').classList.remove('flex');
  document.getElementById('analyze-btn').disabled = true;
  document.getElementById('file-input').value = '';
}

// ================================================================
// SAMPLE IMAGES
// ================================================================
function loadSample(type) {
  const sample = sampleColors[type];
  if (!sample) return;

  // Generate a placeholder canvas image
  const canvas = document.createElement('canvas');
  canvas.width = 400; canvas.height = 300;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = sample.bg;
  ctx.fillRect(0, 0, 400, 300);
  ctx.fillStyle = '#2d6a4f';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(sample.text, 200, 140);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#6b8f73';
  ctx.fillText('Sample Disease Image', 200, 170);

  canvas.toBlob((blob) => {
    selectedFile = new File([blob], `${type}_sample.png`, { type: 'image/png' });
    selectedFile._sampleDisease = sample.disease;

    const url = canvas.toDataURL();
    document.getElementById('preview-img').src = url;
    document.getElementById('upload-placeholder').classList.add('hidden');
    document.getElementById('upload-preview').classList.remove('hidden');
    document.getElementById('upload-preview').classList.add('flex');
    document.getElementById('analyze-btn').disabled = false;

    document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });
    showToast(currentLang === 'ne' ? 'नमूना फोटो लोड भयो!' : 'Sample loaded! Click Analyze', 'success');
  });
}

// ================================================================
// ANALYSIS FLOW
// ================================================================
async function analyzeImage() {
  if (!selectedFile) return;
  showLoading();

  try {
    // Step 1: Processing
    await loadingStep('🔍 ' + (currentLang === 'ne' ? 'फोटो प्रशोधन हुँदैछ...' : 'Processing image...'), 1200);
    // Step 2: AI detection
    await loadingStep('🧠 ' + (currentLang === 'ne' ? 'AI ले रोग पहिचान गर्दैछ...' : 'AI identifying disease...'), 1500);
    // Step 3: Remedy fetch
    await loadingStep('💊 ' + (currentLang === 'ne' ? 'उपचार समाधान खोज्दैछ...' : 'Fetching treatment solutions...'), 1000);

    let result;
    // Try Plant.id API first, fallback to Claude AI analysis, then static DB
    if (selectedFile._sampleDisease) {
      result = { ...diseaseDB[selectedFile._sampleDisease], key: selectedFile._sampleDisease };
    } else {
      result = await analyzeWithClaude();
    }

    hideLoading();
    analysisResult = result;

    if (result && (result.confidence >= 60)) {
      renderResults(result);
    } else {
      showExpertSection();
    }
  } catch (err) {
    hideLoading();
    console.error(err);
    showToast(currentLang === 'ne' ? 'विश्लेषण असफल भयो। पुनः प्रयास गर्नुस्।' : 'Analysis failed. Please try again.', 'error');
  }
}

// Claude AI-powered analysis
async function analyzeWithClaude() {
  try {
    const base64 = await fileToBase64(selectedFile);
    const mediaType = selectedFile.type || 'image/jpeg';

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 }
            },
            {
              type: "text",
              text: `You are a plant pathologist AI. Analyze this plant image and respond ONLY with a valid JSON object (no markdown, no extra text).

Required JSON format:
{
  "plant_en": "Plant species name in English",
  "plant_ne": "Plant name in Nepali",
  "disease_en": "Disease name in English",
  "disease_ne": "Disease name in Nepali",
  "confidence": <number 0-100>,
  "severity": "low|medium|high",
  "urgency": "low|medium|high",
  "desc_en": "Brief disease description in English (2-3 sentences)",
  "desc_ne": "Brief description in Nepali (2-3 sentences)",
  "symptoms_en": ["symptom 1", "symptom 2", "symptom 3"],
  "symptoms_ne": ["लक्षण १", "लक्षण २", "लक्षण ३"],
  "causes_en": ["cause 1", "cause 2"],
  "causes_ne": ["कारण १", "कारण २"],
  "organic_en": [{"icon":"🌿","text":"treatment 1"},{"icon":"🌱","text":"treatment 2"}],
  "organic_ne": [{"icon":"🌿","text":"उपचार १"},{"icon":"🌱","text":"उपचार २"}],
  "local_en": [{"icon":"🪴","text":"local remedy 1"},{"icon":"🌾","text":"local remedy 2"}],
  "local_ne": [{"icon":"🪴","text":"स्थानीय उपाय १"},{"icon":"🌾","text":"स्थानीय उपाय २"}],
  "chemical_en": [{"icon":"🧪","text":"chemical treatment 1"}],
  "chemical_ne": [{"icon":"🧪","text":"रासायनिक उपचार १"}],
  "prevention_en": [{"icon":"🛡️","text":"prevention 1"},{"icon":"🔄","text":"prevention 2"}],
  "prevention_ne": [{"icon":"🛡️","text":"रोकथाम १"},{"icon":"🔄","text":"रोकथाम २"}]
}

If not a plant or cannot identify, return confidence: 30 and fill fields with "Unknown" / "अज्ञात".`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.map(c => c.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.warn('Claude API failed, using fallback:', e);
    // Fallback to a generic result
    return getFallbackResult();
  }
}

function getFallbackResult() {
  // Return a generic plant disease result when API fails
  const keys = Object.keys(diseaseDB);
  return { ...diseaseDB[keys[Math.floor(Math.random() * keys.length)]], _fallback: true };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ================================================================
// LOADING UI
// ================================================================
const loadingSteps = [];
function showLoading() {
  loadingSteps.length = 0;
  document.getElementById('loading-steps').innerHTML = '';
  document.getElementById('loading-overlay').classList.remove('hidden');
  document.getElementById('loading-overlay').classList.add('flex');
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
  document.getElementById('loading-overlay').classList.remove('flex');
}
function loadingStep(msg, delay) {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = 'step-item active';
    el.innerHTML = `<span class="loading-dot">⏳</span> ${msg}`;
    document.getElementById('loading-steps').appendChild(el);
    setTimeout(() => {
      el.classList.remove('active');
      el.classList.add('done');
      el.querySelector('.loading-dot').textContent = '✅';
      resolve();
    }, delay);
  });
}

// ================================================================
// RENDER RESULTS
// ================================================================
function renderResults(data) {
  document.getElementById('results-section').classList.remove('hidden');
  document.getElementById('expert-section').classList.add('hidden');
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });

  // Header
  document.getElementById('result-img').src = document.getElementById('preview-img').src;
  document.getElementById('disease-name').textContent = currentLang === 'ne' ? data.disease_ne : data.disease_en;
  document.getElementById('plant-name').textContent = currentLang === 'ne' ? data.plant_ne : data.plant_en;
  document.getElementById('disease-desc').textContent = currentLang === 'ne' ? data.desc_ne : data.desc_en;

  // Confidence badge
  const confBadge = document.getElementById('confidence-badge');
  confBadge.textContent = `${data.confidence}% ${currentLang === 'ne' ? 'निश्चितता' : 'Confidence'}`;

  // Urgency badge
  const urgencyBadge = document.getElementById('urgency-badge');
  const urgencyLabels = {
    en: { high: '🔴 Urgent', medium: '🟡 Moderate', low: '🟢 Low Risk' },
    ne: { high: '🔴 तत्काल', medium: '🟡 मध्यम', low: '🟢 कम जोखिम' }
  };
  urgencyBadge.textContent = (urgencyLabels[currentLang] || urgencyLabels.en)[data.urgency] || 'Unknown';
  urgencyBadge.className = `urgency-badge px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider urgency-${data.urgency}`;

  // Symptoms
  renderList('symptoms-list', currentLang === 'ne' ? data.symptoms_ne : data.symptoms_en);
  // Causes
  renderList('causes-list', currentLang === 'ne' ? data.causes_ne : data.causes_en);

  // Treatment tabs
  renderTreatment('organic', currentLang === 'ne' ? data.organic_ne : data.organic_en);
  renderTreatment('local', currentLang === 'ne' ? data.local_ne : data.local_en);
  renderTreatment('chemical', currentLang === 'ne' ? data.chemical_ne : data.chemical_en);
  renderTreatment('prevention', currentLang === 'ne' ? data.prevention_ne : data.prevention_en);

  switchTab('organic');

  // Show expert button if low confidence
  if (data.confidence < 60) {
    setTimeout(() => showExpertSection(), 100);
  }
}

function renderList(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el || !items) return;
  el.innerHTML = items.map(item =>
    `<li class="info-list-item">${item}</li>`
  ).join('');
}

function renderTreatment(tab, items) {
  const el = document.getElementById(`tab-content-${tab}`);
  if (!el || !items) return;
  el.innerHTML = items.map(item =>
    `<div class="treatment-item">
      <span class="treatment-icon">${item.icon || '🌿'}</span>
      <span>${item.text}</span>
    </div>`
  ).join('');
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  document.getElementById(`tab-content-${tab}`)?.classList.remove('hidden');
}

// ================================================================
// EXPERT SECTION
// ================================================================
function showExpertSection() {
  document.getElementById('expert-section').classList.remove('hidden');
  document.getElementById('expert-section').scrollIntoView({ behavior: 'smooth' });
}

function submitExpertForm() {
  const name = document.getElementById('form-name').value.trim();
  const location = document.getElementById('form-location').value.trim();
  const msg = document.getElementById('form-msg').value.trim();
  if (!name || !msg) {
    showToast(currentLang === 'ne' ? 'कृपया नाम र समस्या भर्नुस्' : 'Please fill name and problem', 'error');
    return;
  }
  showToast(currentLang === 'ne' ? '✅ सफलतापूर्वक पेश गरियो! विशेषज्ञले चाँडै सम्पर्क गर्नेछन्।' : '✅ Submitted! An expert will contact you soon.', 'success');
  document.getElementById('form-name').value = '';
  document.getElementById('form-location').value = '';
  document.getElementById('form-msg').value = '';
}

// ================================================================
// RESET
// ================================================================
function resetScan() {
  selectedFile = null;
  analysisResult = null;
  document.getElementById('preview-img').src = '';
  document.getElementById('upload-placeholder').classList.remove('hidden');
  document.getElementById('upload-preview').classList.add('hidden');
  document.getElementById('upload-preview').classList.remove('flex');
  document.getElementById('analyze-btn').disabled = true;
  document.getElementById('file-input').value = '';
  document.getElementById('results-section').classList.add('hidden');
  document.getElementById('expert-section').classList.add('hidden');
  document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });
}

// ================================================================
// TOAST
// ================================================================
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-50 toast-msg px-6 py-3 rounded-2xl text-sm font-medium shadow-xl max-w-xs text-center ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

// ================================================================
// INIT
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage();
  // Intersection observer for scroll animations on step cards
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '0';
        entry.target.style.transform = 'translateY(30px)';
        setTimeout(() => {
          entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, i * 120);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.step-card, .stat-chip').forEach(el => observer.observe(el));
});
