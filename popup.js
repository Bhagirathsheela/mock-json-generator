// --- Word list for sentences ---
const words = [
  "the","project","is","to","create","an","app","with","features","user","interface",
  "data","mock","generate","api","testing","random","functionality","design","backend",
  "frontend","component","system","dynamic","model","service","integration","database",
  "query","storage","authentication","authorization","client","server","protocol","http",
  "json","xml","format","validate","parse","compile","deploy","docker","kubernetes",
  "scalable","responsive","layout","grid","flex","tailwind","react","express","node",
  "mongodb","sql","nosql","cloud","storage","upload","cdn","cache","queue","worker",
  "event","listener","socket","stream","security","encryption","hash","token","session",
  "cookie","header","request","response","latency","performance","optimize","thread",
  "process","algorithm","machine","learning","artificial","intelligence","neural",
  "network","training","dataset","modeling","pipeline","automation","build","script",
  "utility","function","variable","constant","error","exception","debug","log","unit",
  "integration","deployment","production","staging","development","test","branch",
  "commit","merge","pull","push","repository","github","gitlab","bitbucket","version",
  "release","pipeline","ci","cd","agile","scrum","sprint","kanban","jira","ticket",
  "issue","bug","fix","patch","feature","story","epic","roadmap","vision","milestone",
  "goal","objective","task","priority","deadline"
];

// --- Sample names ---
const sampleNames = ["Bhagi", "Aarav", "Priya", "Rahul", "Sneha", "Kabir", "Ananya", "Rohan", "Kavya", "Dev", "Ishaan", "Meera"];
const sampleLastNames = ["Rathore", "Sharma", "Patel", "Kumar", "Verma", "Gupta", "Yadav", "Singh", "Reddy", "Iyer", "Nair", "Chopra"];

// --- Random images pool ---
const sampleImages = [
  ...Array.from({ length: 20 }, (_, i) => `https://picsum.photos/seed/pic${i+1}/400/300`),
  "https://source.unsplash.com/random/400x300/?nature",
  "https://source.unsplash.com/random/400x300/?city",
  "https://source.unsplash.com/random/400x300/?technology",
  "https://source.unsplash.com/random/400x300/?people",
  "https://source.unsplash.com/random/400x300/?abstract",
  "https://source.unsplash.com/random/400x300/?office",
  "https://source.unsplash.com/random/400x300/?forest",
  "https://source.unsplash.com/random/400x300/?beach",
  "https://source.unsplash.com/random/400x300/?car",
  "https://source.unsplash.com/random/400x300/?architecture",
  "https://placekitten.com/400/300",
  "https://placekitten.com/401/300",
  "https://placekitten.com/402/300",
  "https://placekitten.com/403/300",
  "https://placekitten.com/404/300"
];

// --- Random file pools ---
const sampleDocs = [
  "https://files.test/docs/sample1.pdf",
  "https://files.test/docs/report.docx",
  "https://files.test/docs/data.xlsx",
  "https://files.test/docs/slides.pptx",
  "https://files.test/docs/readme.txt",
  "https://files.test/docs/note.odt",
  "https://files.test/docs/table.ods",
  "https://files.test/docs/presentation.odp"
];
const sampleAudios = [
  "https://files.test/audio/track1.mp3",
  "https://files.test/audio/track2.wav",
  "https://files.test/audio/track3.ogg",
  "https://files.test/audio/song.aac",
  "https://files.test/audio/music.flac"
];
const sampleVideos = [
  "https://files.test/video/video1.mp4",
  "https://files.test/video/video2.avi",
  "https://files.test/video/video3.mov",
  "https://files.test/video/video4.mkv",
  "https://files.test/video/video5.webm"
];
const sampleDataFiles = [
  "https://files.test/data/archive.zip",
  "https://files.test/data/archive.rar",
  "https://files.test/data/archive.7z",
  "https://files.test/data/archive.tar",
  "https://files.test/data/data.csv",
  "https://files.test/data/data.json",
  "https://files.test/data/data.xml"
];

// --- Generators ---
function randomSentence(min, max) {
  const len = Math.floor(Math.random() * (max - min + 1)) + min;
  return Array.from({ length: len }, () => words[Math.floor(Math.random() * words.length)]).join(' ');
}
function randomName() { return `${sampleNames[Math.floor(Math.random()*sampleNames.length)]} ${sampleLastNames[Math.floor(Math.random()*sampleLastNames.length)]}`; }
function randomShortWord() { return words[Math.floor(Math.random()*words.length)]; }
function randomString(length=8){ return Array.from({length},()=> "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random()*26)]).join(""); }
function randomDate(){ const start=new Date(2020,0,1); const end=new Date(2025,11,31); return new Date(start.getTime()+Math.random()*(end.getTime()-start.getTime())).toISOString(); }
function randomNumber(){ return Math.floor(Math.random()*10000); }
function randomEmail(){ return `${randomString(6)}@${randomString(5)}.com`; }
function randomPhone(){ return `+91${Math.floor(6000000000+Math.random()*4000000000)}`; }
function randomImage(){ return sampleImages[Math.floor(Math.random()*sampleImages.length)]; }
function randomDoc(){ return sampleDocs[Math.floor(Math.random()*sampleDocs.length)]; }
function randomAudio(){ return sampleAudios[Math.floor(Math.random()*sampleAudios.length)]; }
function randomVideo(){ return sampleVideos[Math.floor(Math.random()*sampleVideos.length)]; }
function randomDataFile(){ return sampleDataFiles[Math.floor(Math.random()*sampleDataFiles.length)]; }

// --- Type detection ---
function detectTypeFromValue(value,key){
  if(typeof value==='number') return 'number';
  if(typeof value==='boolean') return 'boolean';
  if(typeof value==='string'){
    if(/^\d{4}-\d{2}-\d{2}T/.test(value)) return 'date';
    if(/@/.test(value)) return 'email';
    if(/^\+?\d{10,}$/.test(value)) return 'phone';
    if(/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(value)) return 'image';
    if(/\.(pdf|docx|xlsx|pptx|txt|rtf|odt|ods|odp)$/i.test(value)) return 'doc';
    if(/\.(mp3|wav|ogg|aac|flac)$/i.test(value)) return 'audio';
    if(/\.(mp4|avi|mov|mkv|webm)$/i.test(value)) return 'video';
    if(/\.(zip|rar|7z|tar|csv|json|xml)$/i.test(value)) return 'data';
    if(/^https:\/\/(picsum|source\.unsplash|placekitten)/.test(value)) return 'image';
    return 'string';
  }
  if(Array.isArray(value)) return 'array';
  if(typeof value==='object' && value!==null) return 'object';
  return 'unknown';
}

// --- Generate by type ---
function generateByType(type,key,templateValue){
  switch(type){
    case 'date': return randomDate();
    case 'image': return randomImage();
    case 'doc': return randomDoc();
    case 'audio': return randomAudio();
    case 'video': return randomVideo();
    case 'data': return randomDataFile();
    case 'email': return randomEmail();
    case 'phone': return randomPhone();
    case 'number': return randomNumber();
    case 'boolean': return Math.random()<0.5;
    case 'string':
      if(/name$/i.test(key)) return randomName();
      if(/title|task|role/i.test(key)) return randomShortWord();
      if(/desc|about|bio|detail/i.test(key)) return randomSentence(8,20)+'.';
      if(templateValue && templateValue.length<=15) return randomShortWord();
      if(templateValue && templateValue.length<=40) return randomSentence(3,7)+'.';
      return randomSentence(8,20)+'.';
    default: return randomSentence(5,15)+'.';
  }
}

// --- Recursive generator ---
function generateRandomFromTemplate(template,parentKey=""){
  if(Array.isArray(template)){
    const len=Math.max(1,template.length||Math.floor(Math.random()*3)+1);
    return Array.from({length:len},()=>generateRandomFromTemplate(template[0],parentKey));
  }
  if(typeof template==='object' && template!==null){
    const newObj={};
    for(let key in template){
      newObj[key]=generateRandomFromTemplate(template[key],key);
    }
    return newObj;
  }
  const type=detectTypeFromValue(template,parentKey);
  return generateByType(type,parentKey,template);
}

// --- Generate multiple ---
function generateData(template,count){
  return Array.from({length:count},()=>generateRandomFromTemplate(template));
}

// --- Save/Load ---
function saveState(template,output){
  localStorage.setItem('mockapi_template',template);
  localStorage.setItem('mockapi_output',output);
}
function loadState(){
  const template=localStorage.getItem('mockapi_template');
  const output=localStorage.getItem('mockapi_output');
  if(template) document.getElementById('jsonInput').value=template;
  if(output) document.getElementById('output').textContent=output;
}

// Auto-close brackets and quotes in JSON input
const jsonInput = document.getElementById('jsonInput');

jsonInput.addEventListener('keydown', (e) => {
  const pairs = {
    '{': '}',
    '[': ']',
    '"': '"'
  };

  // Auto-insert closing pair
  if (pairs[e.key]) {
    e.preventDefault();

    const start = jsonInput.selectionStart;
    const end = jsonInput.selectionEnd;
    const open = e.key;
    const close = pairs[e.key];

    const before = jsonInput.value.substring(0, start);
    const selection = jsonInput.value.substring(start, end);
    const after = jsonInput.value.substring(end);

    jsonInput.value = before + open + selection + close + after;

    // Move cursor inside the pair
    jsonInput.selectionStart = jsonInput.selectionEnd = start + 1;
  }

  // If closing char exists already, skip it
  if ((e.key === '}' || e.key === ']' || e.key === '"') &&
    jsonInput.value.substring(jsonInput.selectionStart, jsonInput.selectionStart + 1) === e.key) {
    e.preventDefault();
    jsonInput.selectionStart++;
    jsonInput.selectionEnd++;
  }
});

// --- UI events ---
document.getElementById('generateBtn').addEventListener('click',()=>{
  try{
    let rawInput=document.getElementById('jsonInput').value;
    rawInput=rawInput.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g,'$1"$2":');
    const template=JSON.parse(rawInput);
    const count=parseInt(document.getElementById('countSelect').value,10);
    const wrapType=document.getElementById('wrapType').value;
    const data=generateData(template,count);
    const output=wrapType==='object'?{data}:data;
    const outputStr=JSON.stringify(output,null,2);
    document.getElementById('output').textContent=outputStr;
    saveState(rawInput,outputStr);
  }catch(e){ alert("Invalid JSON: "+e.message); }
});

document.getElementById('copyBtn').addEventListener('click',()=>{
  const text=document.getElementById('output').textContent;
  navigator.clipboard.writeText(text).then(()=>alert('Copied to clipboard!'));
});

document.getElementById('downloadBtn').addEventListener('click',()=>{
  const text=document.getElementById('output').textContent;
  const blob=new Blob([text],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='mockapi.json';
  a.click();
  URL.revokeObjectURL(url);
});


// --- Load state ---
loadState();
