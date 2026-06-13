// =====================================================================
// Mock data generator — ported verbatim from the original popup.js,
// reorganized as a framework-agnostic ES module. The detection +
// generation logic is unchanged; only `export` and the input-normalizer
// (`parseTemplate`) were added so React (and tests) can import it.
// =====================================================================

// --- Word list for sentences ---
const words = [
  "the","project","is","to","create","an","app","with","features","user","interface",
  "data","mock","generate","api","testing","random","functionality","design","backend",
  "frontend","component","system","dynamic","model","service","integration","database",
  "query","storage","authentication","authorization","client","server","protocol","http",
  "json","xml","format","validate","parse","compile","deploy","docker","kubernetes",
  "scalable","responsive","layout","grid","flex","tailwind","react","express","node",
  "mongodb","sql","nosql","cloud","upload","cdn","cache","queue","worker",
  "event","listener","socket","stream","security","encryption","hash","token","session",
  "cookie","header","request","response","latency","performance","optimize","thread",
  "process","algorithm","machine","learning","artificial","intelligence","neural",
  "network","training","dataset","modeling","pipeline","automation","build","script",
  "utility","function","variable","constant","error","exception","debug","log","unit",
  "deployment","production","staging","development","test","branch",
  "commit","merge","pull","push","repository","github","gitlab","bitbucket","version",
  "release","ci","cd","agile","scrum","sprint","kanban","jira","ticket",
  "issue","bug","fix","patch","feature","story","epic","roadmap","vision","milestone",
  "goal","objective","task","priority","deadline",
];

// --- Sample names ---
const sampleNames = ["Bhagi","Aarav","Priya","Rahul","Sneha","Kabir","Ananya","Rohan","Kavya","Dev","Ishaan","Meera"];
const sampleLastNames = ["Rathore","Sharma","Patel","Kumar","Verma","Gupta","Yadav","Singh","Reddy","Iyer","Nair","Chopra"];

// --- Random images pool (picsum.photos is the only one still live as of 2026) ---
const sampleImages = Array.from({ length: 25 }, (_, i) => `https://picsum.photos/seed/pic${i + 1}/400/300`);

// --- Random file pools ---
const sampleDocs = [
  "https://files.test/docs/sample1.pdf","https://files.test/docs/report.docx",
  "https://files.test/docs/data.xlsx","https://files.test/docs/slides.pptx",
  "https://files.test/docs/readme.txt","https://files.test/docs/note.odt",
  "https://files.test/docs/table.ods","https://files.test/docs/presentation.odp",
];
const sampleAudios = [
  "https://files.test/audio/track1.mp3","https://files.test/audio/track2.wav",
  "https://files.test/audio/track3.ogg","https://files.test/audio/song.aac",
  "https://files.test/audio/music.flac",
];
const sampleVideos = [
  "https://files.test/video/video1.mp4","https://files.test/video/video2.avi",
  "https://files.test/video/video3.mov","https://files.test/video/video4.mkv",
  "https://files.test/video/video5.webm",
];
const sampleDataFiles = [
  "https://files.test/data/archive.zip","https://files.test/data/archive.rar",
  "https://files.test/data/archive.7z","https://files.test/data/archive.tar",
  "https://files.test/data/data.csv","https://files.test/data/data.json",
  "https://files.test/data/data.xml",
];

// --- Generators ---
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function randomSentence(min, max) {
  const len = Math.floor(Math.random() * (max - min + 1)) + min;
  return Array.from({ length: len }, () => pick(words)).join(" ");
}
function randomName() { return `${pick(sampleNames)} ${pick(sampleLastNames)}`; }
function randomShortWord() { return pick(words); }
function randomString(length = 8) {
  return Array.from({ length }, () => "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]).join("");
}
function randomDate() {
  const start = new Date(2020, 0, 1);
  const end = new Date(2025, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}
function randomNumber() { return Math.floor(Math.random() * 10000); }
function randomEmail() { return `${randomString(6)}@${randomString(5)}.com`; }
function randomPhone() { return `+91${Math.floor(6000000000 + Math.random() * 4000000000)}`; }

// --- Type detection ---
function detectTypeFromValue(value) {
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return "date";
    if (/@/.test(value)) return "email";
    if (/^\+?\d{10,}$/.test(value)) return "phone";
    if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(value)) return "image";
    if (/\.(pdf|docx|xlsx|pptx|txt|rtf|odt|ods|odp)$/i.test(value)) return "doc";
    if (/\.(mp3|wav|ogg|aac|flac)$/i.test(value)) return "audio";
    if (/\.(mp4|avi|mov|mkv|webm)$/i.test(value)) return "video";
    if (/\.(zip|rar|7z|tar|csv|json|xml)$/i.test(value)) return "data";
    if (/^https:\/\/(picsum|source\.unsplash|placekitten)/.test(value)) return "image";
    return "string";
  }
  if (Array.isArray(value)) return "array";
  if (typeof value === "object" && value !== null) return "object";
  return "unknown";
}

// --- Generate by type ---
function generateByType(type, key, templateValue) {
  switch (type) {
    case "date": return randomDate();
    case "image": return pick(sampleImages);
    case "doc": return pick(sampleDocs);
    case "audio": return pick(sampleAudios);
    case "video": return pick(sampleVideos);
    case "data": return pick(sampleDataFiles);
    case "email": return randomEmail();
    case "phone": return randomPhone();
    case "number": return randomNumber();
    case "boolean": return Math.random() < 0.5;
    case "string":
      if (/name$/i.test(key)) return randomName();
      if (/title|task|role/i.test(key)) return randomShortWord();
      if (/desc|about|bio|detail/i.test(key)) return randomSentence(8, 20) + ".";
      if (templateValue && templateValue.length <= 15) return randomShortWord();
      if (templateValue && templateValue.length <= 40) return randomSentence(3, 7) + ".";
      return randomSentence(8, 20) + ".";
    default: return randomSentence(5, 15) + ".";
  }
}

// --- Recursive generator ---
function generateRandomFromTemplate(template, parentKey = "") {
  if (Array.isArray(template)) {
    const len = Math.max(1, template.length || Math.floor(Math.random() * 3) + 1);
    return Array.from({ length: len }, () => generateRandomFromTemplate(template[0], parentKey));
  }
  if (typeof template === "object" && template !== null) {
    const newObj = {};
    for (const key in template) newObj[key] = generateRandomFromTemplate(template[key], key);
    return newObj;
  }
  const type = detectTypeFromValue(template, parentKey);
  return generateByType(type, parentKey, template);
}

// --- Public API ---

/** Parse a lenient JSON template (allows unquoted keys, like the original). */
export function parseTemplate(rawInput) {
  const normalized = rawInput.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
  return JSON.parse(normalized);
}

/** Generate `count` records from a parsed template object. */
export function generateData(template, count) {
  return Array.from({ length: count }, () => generateRandomFromTemplate(template));
}

/**
 * One-shot helper: takes raw text + options, returns the output value
 * (array, or `{ data: [...] }` when wrapType === "object").
 */
export function generateFromRaw(rawInput, { count = 5, wrapType = "array" } = {}) {
  const template = parseTemplate(rawInput);
  const data = generateData(template, count);
  return wrapType === "object" ? { data } : data;
}
