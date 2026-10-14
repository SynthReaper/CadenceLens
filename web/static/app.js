/**
 * CadenceLens Dashboard Controller (AccessLens Inspired Paper Edition)
 * Synchronizes audio playback, real-time karaoke transcript highlighting,
 * live microphone teleprompter lab, Praat forensic telemetry, 2D vowel formant charts,
 * multi-tab switching, and witty/charming causal flaw roasts.
 */

let currentData = null;
let currentMetricView = "pitch"; // "pitch", "energy", "rate"
let chartInstance = null;
let formantChartInstance = null;

// Navigation Tabs
const tabBtnStudio = document.getElementById("tabBtnStudio");
const tabBtnMic = document.getElementById("tabBtnMic");
const tabBtnBenchmark = document.getElementById("tabBtnBenchmark");
const tabBtnDocs = document.getElementById("tabBtnDocs");

const viewStudio = document.getElementById("viewStudio");
const viewMicLab = document.getElementById("viewMicLab");
const viewBenchmark = document.getElementById("viewBenchmark");
const viewDocs = document.getElementById("viewDocs");

// Live Microphone Lab Elements
const btnMicLabRecord = document.getElementById("btnMicLabRecord");
const btnMicLabStop = document.getElementById("btnMicLabStop");
const micLabTimer = document.getElementById("micLabTimer");
const micLabMeter = document.getElementById("micLabMeter");
const micLabLevel = document.getElementById("micLabLevel");
const micLabResults = document.getElementById("micLabResults");

let micLabAudioCtx = null;
let micLabAnalyser = null;
let micLabAnimFrame = null;
let micLabRecorder = null;
let micLabChunks = [];
let micLabTimerInterval = null;
let micLabSecs = 0;

// Studio Drawer Recording State
let mediaRecorder = null;
let recordedChunks = [];
let recordInterval = null;
let recordSeconds = 0;

// Studio DOM Elements
const selectSpeech = document.getElementById("selectSpeech");
const selectTier = document.getElementById("selectTier");
const btnRunPreset = document.getElementById("btnRunPreset");

const btnToggleUpload = document.getElementById("btnToggleUpload");
const uploadDrawer = document.getElementById("uploadDrawer");
const btnSubmitUpload = document.getElementById("btnSubmitUpload");
const customAudioFile = document.getElementById("customAudioFile");
const customTranscript = document.getElementById("customTranscript");

const speechTitle = document.getElementById("speechTitle");
const speechSpeaker = document.getElementById("speechSpeaker");
const speechVoiceModel = document.getElementById("speechVoiceModel");
const wordsContainer = document.getElementById("wordsContainer");

const audioBase = document.getElementById("audioBase");
const audioTest = document.getElementById("audioTest");
const baseDurationLabel = document.getElementById("baseDurationLabel");
const testDurationLabel = document.getElementById("testDurationLabel");

// Praat Telemetry Elements
const valHNR = document.getElementById("valHNR");
const valJitter = document.getElementById("valJitter");
const valShimmer = document.getElementById("valShimmer");
const valF1 = document.getElementById("valF1");
const valF2 = document.getElementById("valF2");
const valDTW = document.getElementById("valDTW");

// Scorecard Elements
const valCDI = document.getElementById("valCDI");
const badgeGrade = document.getElementById("badgeGrade");
const verdictText = document.getElementById("verdictText");

const scorePacing = document.getElementById("scorePacing");
const barPacing = document.getElementById("barPacing");
const scorePitch = document.getElementById("scorePitch");
const barPitch = document.getElementById("barPitch");
const scoreStress = document.getElementById("scoreStress");
const barStress = document.getElementById("barStress");
const scoreFluency = document.getElementById("scoreFluency");
const barFluency = document.getElementById("barFluency");

const metaWPM = document.getElementById("metaWPM");
const metaPitchStd = document.getElementById("metaPitchStd");
const metaDynRange = document.getElementById("metaDynRange");
const metaDur = document.getElementById("metaDur");

// Flaws Deck
const flawCountBadge = document.getElementById("flawCountBadge");
const flawsContainer = document.getElementById("flawsContainer");

const cardFlawType = document.getElementById("cardFlawType");
const cardFlawInterval = document.getElementById("cardFlawInterval");
const cardSeverity = document.getElementById("cardSeverity");
const cardMathProof = document.getElementById("cardMathProof");
const cardPhrase = document.getElementById("cardPhrase");
const cardCausal = document.getElementById("cardCausal");
const cardCoaching = document.getElementById("cardCoaching");

const btnViewPitch = document.getElementById("btnViewPitch");
const btnViewEnergy = document.getElementById("btnViewEnergy");
const btnViewRate = document.getElementById("btnViewRate");

// Initialize Application
async function init() {
  await loadSpeeches();
  setupEventListeners();
  setupKaraokeSync();
  await runPresetEvaluation();
  setTimeout(renderMath, 600);
}

function switchTab(tabName) {
  const tabs = [
    { btn: tabBtnStudio, view: viewStudio, name: "studio" },
    { btn: tabBtnMic, view: viewMicLab, name: "mic" },
    { btn: tabBtnBenchmark, view: viewBenchmark, name: "benchmark" },
    { btn: tabBtnDocs, view: viewDocs, name: "docs" }
  ];

  tabs.forEach(t => {
    if (!t.btn || !t.view) return;
    if (t.name === tabName) {
      t.btn.classList.add("active");
      t.view.classList.remove("hidden");
    } else {
      t.btn.classList.remove("active");
      t.view.classList.add("hidden");
    }
  });

  if (tabName === "benchmark") {
    renderFormantScatterChart();
  }
  if (tabName === "docs") {
    renderMath();
  }
}

async function loadSpeeches() {
  try {
    const res = await fetch("/api/speeches");
    const speeches = await res.json();
    if (!selectSpeech) return;
    selectSpeech.innerHTML = "";
    
    for (const [key, val] of Object.entries(speeches)) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = `${val.title} — ${val.speaker}`;
      selectSpeech.appendChild(opt);
    }
  } catch (err) {
    console.error("Failed to load speeches:", err);
  }
}

function setupEventListeners() {
  // Tabs
  if (tabBtnStudio) tabBtnStudio.addEventListener("click", () => switchTab("studio"));
  if (tabBtnMic) tabBtnMic.addEventListener("click", () => switchTab("mic"));
  if (tabBtnBenchmark) tabBtnBenchmark.addEventListener("click", () => switchTab("benchmark"));
  if (tabBtnDocs) tabBtnDocs.addEventListener("click", () => switchTab("docs"));

  // Evaluation triggers
  if (btnRunPreset) btnRunPreset.addEventListener("click", runPresetEvaluation);
  if (selectSpeech) selectSpeech.addEventListener("change", runPresetEvaluation);
  if (selectTier) selectTier.addEventListener("change", runPresetEvaluation);

  // Studio Upload Drawer
  if (btnToggleUpload && uploadDrawer) {
    btnToggleUpload.addEventListener("click", () => {
      uploadDrawer.classList.toggle("hidden");
    });
  }

  if (btnSubmitUpload) btnSubmitUpload.addEventListener("click", handleCustomUpload);

  // Live Microphone Lab
  if (btnMicLabRecord) btnMicLabRecord.addEventListener("click", startMicLabRecording);
  if (btnMicLabStop) btnMicLabStop.addEventListener("click", stopMicLabRecording);

  // Metric Toggle Buttons
  if (btnViewPitch) btnViewPitch.addEventListener("click", () => switchMetricView("pitch"));
  if (btnViewEnergy) btnViewEnergy.addEventListener("click", () => switchMetricView("energy"));
  if (btnViewRate) btnViewRate.addEventListener("click", () => switchMetricView("rate"));
}

// -------------------------------------------------------------
// Live Microphone Lab (View 2)
// -------------------------------------------------------------
function updateMicLabMeter() {
  if (!micLabAnalyser) return;
  const buffer = new Uint8Array(micLabAnalyser.frequencyBinCount);
  micLabAnalyser.getByteFrequencyData(buffer);
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i];
  }
  const avg = sum / buffer.length;
  const pct = Math.min(100, Math.round((avg / 128) * 100));
  if (micLabMeter) micLabMeter.style.width = pct + "%";
  if (micLabLevel) micLabLevel.textContent = pct + "%";
  micLabAnimFrame = requestAnimationFrame(updateMicLabMeter);
}

async function startMicLabRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micLabChunks = [];
    micLabRecorder = new MediaRecorder(stream);
    
    micLabRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) micLabChunks.push(e.data);
    };

    micLabRecorder.onstop = async () => {
      const rawBlob = new Blob(micLabChunks, { type: micLabRecorder.mimeType || "audio/webm" });
      const wavBlob = await webmToWavBlob(rawBlob);
      await processMicLabAudio(wavBlob);
    };

    // Web Audio API volume visualizer
    micLabAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = micLabAudioCtx.createMediaStreamSource(stream);
    micLabAnalyser = micLabAudioCtx.createAnalyser();
    micLabAnalyser.fftSize = 256;
    source.connect(micLabAnalyser);
    updateMicLabMeter();

    micLabRecorder.start();
    btnMicLabRecord.disabled = true;
    btnMicLabRecord.className = "bg-[#f4ece8] text-[#594139] font-mono text-xs font-bold px-5 py-2.5 rounded-lg border-2 border-[#1e1b19] shadow-press-xs cursor-not-allowed flex items-center gap-2";
    btnMicLabStop.disabled = false;
    btnMicLabStop.className = "bg-[#cb4914] hover:bg-[#a73400] text-white font-mono text-xs font-bold px-5 py-2.5 rounded-lg border-2 border-[#1e1b19] shadow-press active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer";

    micLabSecs = 0;
    micLabTimer.textContent = "00:00";
    micLabTimerInterval = setInterval(() => {
      micLabSecs++;
      const m = String(Math.floor(micLabSecs / 60)).padStart(2, "0");
      const s = String(micLabSecs % 60).padStart(2, "0");
      micLabTimer.textContent = `${m}:${s}`;
    }, 1000);

  } catch (err) {
    alert("Microphone access denied or unavailable: " + err.message);
  }
}

function stopMicLabRecording() {
  if (micLabRecorder && micLabRecorder.state !== "inactive") {
    micLabRecorder.stop();
    micLabRecorder.stream.getTracks().forEach(t => t.stop());
  }
  if (micLabAudioCtx) {
    micLabAudioCtx.close();
    micLabAudioCtx = null;
  }
  if (micLabAnimFrame) {
    cancelAnimationFrame(micLabAnimFrame);
    micLabAnimFrame = null;
  }
  clearInterval(micLabTimerInterval);
  if (micLabMeter) micLabMeter.style.width = "0%";
  if (micLabLevel) micLabLevel.textContent = "0%";

  btnMicLabRecord.disabled = false;
  btnMicLabRecord.className = "bg-[#cb4914] hover:bg-[#a73400] text-white font-mono text-xs font-bold px-5 py-2.5 rounded-lg border-2 border-[#1e1b19] shadow-press active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2";
  btnMicLabStop.disabled = true;
  btnMicLabStop.className = "bg-[#f4ece8] text-[#594139] font-mono text-xs font-bold px-5 py-2.5 rounded-lg border-2 border-[#1e1b19] shadow-press-xs cursor-not-allowed flex items-center gap-2";
}

async function processMicLabAudio(blob) {
  btnMicLabStop.innerHTML = `<span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-[#1e1b19] border-t-transparent rounded-full"></span> Analyzing Voice...`;

  try {
    const formData = new FormData();
    formData.append("audio_file", blob, "live_user_oration.wav");
    formData.append("preset_baseline", selectSpeech.value || "jfk_inaugural");
    formData.append("transcript", "And so, my fellow Americans: ask not what your country can do for you — ask what you can do for your country. My fellow citizens of the world: ask not what America will do for you, but what together we can do for the freedom of man.");

    const res = await fetch("/api/evaluate/upload", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    renderMicLabResults(data, blob);
  } catch (err) {
    alert("Microphone evaluation failed: " + err.message);
  } finally {
    btnMicLabStop.innerHTML = `<i data-lucide="square" class="w-4 h-4"></i> Stop & Analyze`;
    lucide.createIcons();
  }
}

function renderMicLabResults(data, blob) {
  if (!micLabResults) return;
  micLabResults.classList.remove("hidden");
  const sc = data.scorecard;
  const fo = (data.forensics && data.forensics.test) ? data.forensics.test : {};
  const su = data.summary;
  const flaws = data.flaws || [];
  const localAudioUrl = URL.createObjectURL(blob);

  let stampText = `Grade: ${sc.letter_grade}`;
  let stampClass = "rubber-stamp text-xs font-mono font-bold ";
  let roastVerdict = sc.summary_verdict;

  if (sc.letter_grade.startsWith("A")) {
    stampClass += "text-[#37613d] border-[#37613d] -rotate-3";
    stampText = `🏅 ${sc.letter_grade} • PRESIDENTIAL GRADE`;
    roastVerdict = "Standing ovation! The delivery matches presidential cadences with stellar rhythm and breath support.";
  } else if (sc.letter_grade === "B") {
    stampClass += "text-[#d97706] border-[#d97706] rotate-2";
    stampText = `☕ ${sc.letter_grade} • POLISHED ORATOR`;
    roastVerdict = "Competent declamation with minor pacing friction. You'd easily clear the debate semi-finals!";
  } else if (sc.letter_grade === "C") {
    stampClass += "text-[#cb4914] border-[#cb4914] -rotate-2";
    stampText = `⚠️ ${sc.letter_grade} • CADENCE DEFICITS`;
    roastVerdict = "A bit rushed and nervous in spots. Take deeper diaphragmatic breaths before initiating phrases.";
  } else {
    stampClass += "text-[#991b1b] border-[#991b1b] rotate-3";
    stampText = `🤖 ${sc.letter_grade} • ROBOT DETECTED`;
    roastVerdict = "Siri is calling to ask for her cadence back! Heavy monotone or severe tempo surges detected.";
  }

  micLabResults.innerHTML = `
    <div class="relative bg-white border-2 border-[#1e1b19] rounded-xl p-6 shadow-press space-y-5">
      <div class="absolute -top-2.5 right-6 pushpin-secondary"></div>
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-dashed border-[#e5d8d0] pb-4">
        <div>
          <span class="washi-tape-tertiary text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#1e1b19] text-[#805200]">
            BOOTH INCIDENT REPORT
          </span>
          <h3 class="font-display font-extrabold text-lg text-[#1e1b19] mt-1">
            Personal Speech Evaluation Results
          </h3>
          <p class="font-serif text-sm text-[#1e1b19] mt-0.5">${roastVerdict}</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <div class="text-[10px] font-mono font-bold text-[#594139] uppercase">CDI Score</div>
            <div class="text-3xl font-mono font-black text-[#1e1b19]">${sc.composite_delivery_index} <span class="text-xs text-[#594139] font-normal">/100</span></div>
          </div>
          <div class="${stampClass}">
            ${stampText}
          </div>
        </div>
      </div>

      <!-- Playback Bar -->
      <div class="bg-[#fff8f5] border-2 border-[#1e1b19] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-press-xs">
        <div class="flex items-center gap-2 text-xs font-mono font-bold text-[#1e1b19]">
          <span>🎧 Your Recording:</span>
          <span class="text-[#594139]">(${su.duration_test_sec}s)</span>
        </div>
        <audio controls src="${localAudioUrl}" class="w-full sm:w-80 h-8"></audio>
      </div>

      <!-- 4 Core Rubric Pillars -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-[#fff8f5] border border-[#1e1b19] rounded-lg p-2.5">
          <div class="flex justify-between text-xs font-mono font-bold text-[#594139] mb-1">
            <span>Pacing</span>
            <span class="text-[#1e1b19]">${sc.pacing_score}%</span>
          </div>
          <div class="w-full bg-[#f4ece8] border border-[#1e1b19] h-2 rounded-full overflow-hidden">
            <div class="bg-[#cb4914] h-full rounded-full" style="width: ${sc.pacing_score}%"></div>
          </div>
        </div>

        <div class="bg-[#fff8f5] border border-[#1e1b19] rounded-lg p-2.5">
          <div class="flex justify-between text-xs font-mono font-bold text-[#594139] mb-1">
            <span>Pitch F0</span>
            <span class="text-[#1e1b19]">${sc.pitch_dynamism_score}%</span>
          </div>
          <div class="w-full bg-[#f4ece8] border border-[#1e1b19] h-2 rounded-full overflow-hidden">
            <div class="bg-[#d97706] h-full rounded-full" style="width: ${sc.pitch_dynamism_score}%"></div>
          </div>
        </div>

        <div class="bg-[#fff8f5] border border-[#1e1b19] rounded-lg p-2.5">
          <div class="flex justify-between text-xs font-mono font-bold text-[#594139] mb-1">
            <span>Stress</span>
            <span class="text-[#1e1b19]">${sc.stress_emphasis_score}%</span>
          </div>
          <div class="w-full bg-[#f4ece8] border border-[#1e1b19] h-2 rounded-full overflow-hidden">
            <div class="bg-[#37613d] h-full rounded-full" style="width: ${sc.stress_emphasis_score}%"></div>
          </div>
        </div>

        <div class="bg-[#fff8f5] border border-[#1e1b19] rounded-lg p-2.5">
          <div class="flex justify-between text-xs font-mono font-bold text-[#594139] mb-1">
            <span>Fluency</span>
            <span class="text-[#1e1b19]">${sc.fluency_pause_score}%</span>
          </div>
          <div class="w-full bg-[#f4ece8] border border-[#1e1b19] h-2 rounded-full overflow-hidden">
            <div class="bg-[#0284c7] h-full rounded-full" style="width: ${sc.fluency_pause_score}%"></div>
          </div>
        </div>
      </div>

      <!-- Praat Forensics -->
      <div class="pt-3 border-t-2 border-dashed border-[#e5d8d0]">
        <div class="text-xs font-mono font-bold text-[#594139] mb-2 flex items-center gap-1.5">
          <span>🧪</span> Praat Forensic Biomarkers:
        </div>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono">
          <div class="bg-[#fff8f5] border border-[#1e1b19] p-2 rounded">
            <div class="text-[9px] text-[#594139] font-bold">HNR (dB)</div>
            <div class="text-xs font-black text-[#1e1b19]">${fo.hnr_db !== undefined ? fo.hnr_db : '--'}</div>
          </div>
          <div class="bg-[#fff8f5] border border-[#1e1b19] p-2 rounded">
            <div class="text-[9px] text-[#594139] font-bold">Jitter %</div>
            <div class="text-xs font-black text-[#1e1b19]">${fo.jitter_local_percent !== undefined ? fo.jitter_local_percent : '--'}</div>
          </div>
          <div class="bg-[#fff8f5] border border-[#1e1b19] p-2 rounded">
            <div class="text-[9px] text-[#594139] font-bold">Shimmer %</div>
            <div class="text-xs font-black text-[#1e1b19]">${fo.shimmer_local_percent !== undefined ? fo.shimmer_local_percent : '--'}</div>
          </div>
          <div class="bg-[#fff8f5] border border-[#1e1b19] p-2 rounded">
            <div class="text-[9px] text-[#594139] font-bold">Formant F1</div>
            <div class="text-xs font-black text-[#1e1b19]">${fo.f1_mean_hz !== undefined ? fo.f1_mean_hz + ' Hz' : '--'}</div>
          </div>
          <div class="bg-[#fff8f5] border border-[#1e1b19] p-2 rounded">
            <div class="text-[9px] text-[#594139] font-bold">Formant F2</div>
            <div class="text-xs font-black text-[#1e1b19]">${fo.f2_mean_hz !== undefined ? fo.f2_mean_hz + ' Hz' : '--'}</div>
          </div>
          <div class="bg-[#fff8f5] border border-[#1e1b19] p-2 rounded">
            <div class="text-[9px] text-[#594139] font-bold">DTW Cost</div>
            <div class="text-xs font-black text-[#cb4914]">${su.dtw_alignment_cost !== undefined ? su.dtw_alignment_cost : '--'}</div>
          </div>
        </div>
      </div>

      <!-- Flaws Breakdown -->
      <div class="pt-3 border-t-2 border-dashed border-[#e5d8d0] space-y-3">
        <div class="text-xs font-mono font-bold text-[#594139] flex items-center justify-between">
          <span>🚨 Detected Flaws & Tactical Prescriptions (${flaws.length})</span>
        </div>
        <div class="space-y-2">
          ${flaws.length === 0 ? `
            <div class="p-3 rounded-lg bg-[#c8ecca]/40 border-2 border-[#1e1b19] text-xs text-[#2c4e31] font-mono font-bold flex items-center gap-2">
              <span>🏆</span> Flawless execution! Rhythm and cadence align tightly with the presidential baseline.
            </div>
          ` : flaws.map(f => `
            <div class="p-3.5 rounded-lg bg-[#ffddb6]/35 border-2 border-[#1e1b19] space-y-1.5 text-xs font-mono">
              <div class="flex items-center justify-between">
                <span class="font-bold text-[#1e1b19] flex items-center gap-2">
                  <span>🚨</span> ${f.flaw_type.replace('_', ' ')}
                  <span class="text-[#594139] font-normal">[${f.start_sec}s - ${f.end_sec}s]</span>
                </span>
                <span class="rubber-stamp text-[9px] text-[#cb4914] border-[#cb4914]">${f.severity}</span>
              </div>
              <div class="text-[#1e1b19]">
                <span class="text-[#594139] font-bold">Affected Text:</span> "${f.affected_phrase || 'N/A'}"
              </div>
              <div class="bg-white border border-[#1e1b19] p-2 rounded text-[#1e1b19]">
                ${f.causal_explanation}
              </div>
              <div class="text-[#2c4e31] font-bold">
                💡 <span class="text-[#1e1b19]">Coach:</span> ${f.coaching_recommendation}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
}

// -------------------------------------------------------------
// Preset Evaluation
// -------------------------------------------------------------
async function runPresetEvaluation() {
  const speechKey = selectSpeech.value;
  const tier = selectTier.value;
  if (!speechKey) return;

  btnRunPreset.disabled = true;
  btnRunPreset.innerHTML = `<span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span> Processing...`;

  try {
    const formData = new FormData();
    formData.append("speech_key", speechKey);
    formData.append("tier", tier);

    const res = await fetch("/api/evaluate/preset", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    renderEvaluation(data);
  } catch (err) {
    alert("Evaluation failed: " + err.message);
  } finally {
    btnRunPreset.disabled = false;
    btnRunPreset.innerHTML = `<i data-lucide="play" class="w-4 h-4 fill-current"></i> Evaluate`;
    lucide.createIcons();
  }
}

async function handleCustomUpload() {
  const file = customAudioFile.files[0];
  if (!file) {
    alert("Please select an audio file first.");
    return;
  }

  btnSubmitUpload.disabled = true;
  btnSubmitUpload.innerHTML = `Analyzing...`;

  try {
    const formData = new FormData();
    formData.append("audio_file", file);
    formData.append("preset_baseline", selectSpeech.value);
    formData.append("transcript", customTranscript ? customTranscript.value.trim() : "");

    const res = await fetch("/api/evaluate/upload", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    
    const localAudioUrl = URL.createObjectURL(file);
    data.speech_info.test_audio_url = localAudioUrl;
    
    renderEvaluation(data);
    uploadDrawer.classList.add("hidden");
  } catch (err) {
    alert("Upload analysis failed: " + err.message);
  } finally {
    btnSubmitUpload.disabled = false;
    btnSubmitUpload.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Analyze Uploaded Recording`;
    lucide.createIcons();
  }
}

function renderEvaluation(data) {
  currentData = data;
  const info = data.speech_info || {};
  const scorecard = data.scorecard;
  const summary = data.summary;
  const forensics = data.forensics ? data.forensics.test : {};
  const flaws = data.flaws || [];
  const words = data.words || [];

  // Update Header Metadata
  speechTitle.textContent = info.title || info.speech_key;
  speechSpeaker.textContent = info.speaker || 'Reference Orator';
  speechVoiceModel.textContent = info.voice_model || 'Studio Neural';

  // Render Interactive Karaoke Word Chips
  renderWords(words);

  // Update Audio Players
  if (info.base_audio_url) {
    audioBase.src = info.base_audio_url;
    audioBase.load();
  }
  if (info.test_audio_url) {
    audioTest.src = info.test_audio_url;
    audioTest.load();
  }
  baseDurationLabel.textContent = `${summary.duration_base_sec}s`;
  testDurationLabel.textContent = `${summary.duration_test_sec}s`;

  // Update Praat Forensic Telemetry Bar
  valHNR.textContent = forensics.hnr_db !== undefined ? forensics.hnr_db : "--";
  valJitter.textContent = forensics.jitter_local_percent !== undefined ? forensics.jitter_local_percent : "--";
  valShimmer.textContent = forensics.shimmer_local_percent !== undefined ? forensics.shimmer_local_percent : "--";
  valF1.textContent = forensics.f1_mean_hz !== undefined ? forensics.f1_mean_hz + " Hz" : "--";
  valF2.textContent = forensics.f2_mean_hz !== undefined ? forensics.f2_mean_hz + " Hz" : "--";
  valDTW.textContent = summary.dtw_alignment_cost !== undefined ? summary.dtw_alignment_cost : "--";

  // Update Scorecard & Funny Rubber Stamp
  valCDI.textContent = scorecard.composite_delivery_index;
  
  let stampText = `Grade: ${scorecard.letter_grade}`;
  let stampClass = "rubber-stamp text-xs font-mono font-bold ";
  let roastVerdict = scorecard.summary_verdict;

  if (scorecard.letter_grade.startsWith("A")) {
    stampClass += "text-[#37613d] border-[#37613d] -rotate-3";
    stampText = `🏅 ${scorecard.letter_grade} • ORATOR APPROVED`;
    roastVerdict = "🔥 Presidential fire! Rhythm, cadence, and pause discipline are operating at peak championship standard.";
  } else if (scorecard.letter_grade === "B") {
    stampClass += "text-[#d97706] border-[#d97706] rotate-2";
    stampText = `☕ ${scorecard.letter_grade} • ROOM FOR POLISH`;
    roastVerdict = "Decent delivery, but you hit a minor tempo/pause hiccup. The debate coach gives you an approving nod with one raised eyebrow.";
  } else if (scorecard.letter_grade === "C") {
    stampClass += "text-[#cb4914] border-[#cb4914] -rotate-2";
    stampText = `⚠️ ${scorecard.letter_grade} • CADENCE DETENTION`;
    roastVerdict = "Noticeable acoustic crimes detected! Either you sprinted like an auctioneer or flatlined into a lullaby.";
  } else {
    stampClass += "text-[#991b1b] border-[#991b1b] rotate-3";
    stampText = `🤖 ${scorecard.letter_grade} • ROBOT FELONY`;
    roastVerdict = "🚨 Dial-up modem alert! Multiple compounding delivery collapses—Siri has more emotional resonance than this segment.";
  }

  badgeGrade.textContent = stampText;
  badgeGrade.className = stampClass;
  verdictText.textContent = roastVerdict;

  // Progress Bars
  scorePacing.textContent = `${scorecard.pacing_score}%`;
  barPacing.style.width = `${scorecard.pacing_score}%`;

  scorePitch.textContent = `${scorecard.pitch_dynamism_score}%`;
  barPitch.style.width = `${scorecard.pitch_dynamism_score}%`;

  scoreStress.textContent = `${scorecard.stress_emphasis_score}%`;
  barStress.style.width = `${scorecard.stress_emphasis_score}%`;

  scoreFluency.textContent = `${scorecard.fluency_pause_score}%`;
  barFluency.style.width = `${scorecard.fluency_pause_score}%`;

  // Summary Telemetry
  metaWPM.textContent = `${summary.test_mean_wpm} WPM (Ref: ${summary.base_mean_wpm})`;
  metaPitchStd.textContent = `${summary.test_pitch_std_st} ST (Ref: ${summary.base_pitch_std_st})`;
  metaDynRange.textContent = `${summary.test_dynamic_range_db} dB`;
  metaDur.textContent = `${summary.duration_test_sec}s`;

  // Flaws Timeline Chips
  renderFlawChips(flaws);

  // Render Time-Series Chart
  renderChart();

  // If Benchmark tab is open or opened later, refresh formants
  if (!viewBenchmark.classList.contains("hidden")) {
    renderFormantScatterChart();
  }

  lucide.createIcons();
}

function renderWords(words) {
  wordsContainer.innerHTML = "";
  if (!words || words.length === 0) {
    wordsContainer.innerHTML = `<span class="text-xs text-[#594139] font-mono">No word alignment available.</span>`;
    return;
  }

  words.forEach((w) => {
    const span = document.createElement("span");
    span.className = `word-chip ${w.has_flaw ? 'has-flaw' : ''}`;
    span.textContent = w.word;
    span.dataset.start = w.start_sec;
    span.dataset.end = w.end_sec;
    span.title = `[${w.start_sec}s - ${w.end_sec}s]${w.flaw_type ? ' - Flaw: ' + w.flaw_type : ''}`;

    span.addEventListener("click", () => {
      audioTest.currentTime = w.start_sec;
      audioTest.play();
    });

    wordsContainer.appendChild(span);
  });
}

function setupKaraokeSync() {
  audioTest.addEventListener("timeupdate", () => {
    const ct = audioTest.currentTime;
    const chips = document.querySelectorAll(".word-chip");
    chips.forEach(chip => {
      const s = parseFloat(chip.dataset.start);
      const e = parseFloat(chip.dataset.end);
      if (ct >= s && ct <= e) {
        chip.classList.add("active-karaoke");
      } else {
        chip.classList.remove("active-karaoke");
      }
    });
  });
}

function getFlawColorClasses(flawType) {
  switch (flawType) {
    case "MONOTONE_CADENCE":
      return "border-[#1e1b19] bg-[#ffddb6] text-[#805200] hover:bg-[#ffe7cc]";
    case "ERRATIC_RUSH":
      return "border-[#1e1b19] bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca]";
    case "SLUGGISH_DRAG":
      return "border-[#1e1b19] bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a]";
    case "INAPPROPRIATE_PAUSE":
      return "border-[#1e1b19] bg-[#e0f2fe] text-[#075985] hover:bg-[#bae6fd]";
    case "MISPLACED_EMPHASIS":
      return "border-[#1e1b19] bg-[#ffdbcf] text-[#872a00] hover:bg-[#ffd1c2]";
    default:
      return "border-[#1e1b19] bg-[#ffffff] text-[#1e1b19]";
  }
}

function renderFlawChips(flaws) {
  flawCountBadge.textContent = `${flaws.length} Flaw${flaws.length === 1 ? '' : 's'} Grounded`;
  flawsContainer.innerHTML = "";

  if (flaws.length === 0) {
    flawsContainer.innerHTML = `<span class="text-xs text-[#37613d] font-mono font-bold px-2 py-1 bg-[#c8ecca]/40 border border-[#1e1b19] rounded-lg flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5"></i> Flawless delivery! No oratorical defects detected.</span>`;
    clearCausalCard();
    return;
  }

  flaws.forEach((flaw, idx) => {
    const chip = document.createElement("button");
    const colors = getFlawColorClasses(flaw.flaw_type);
    chip.className = `flaw-chip text-xs font-mono font-bold px-3 py-1.5 rounded-lg border-2 border-[#1e1b19] shadow-press-xs flex items-center gap-2 ${colors}`;
    chip.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-current"></span>
      <span>${flaw.flaw_type.replace('_', ' ')}</span>
      <span class="opacity-75 font-normal">[${flaw.start_sec}s - ${flaw.end_sec}s]</span>
    `;

    chip.addEventListener("click", () => {
      document.querySelectorAll(".flaw-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");

      audioTest.currentTime = flaw.start_sec;
      audioTest.play();

      displayFlawDetail(flaw);
    });

    flawsContainer.appendChild(chip);

    if (idx === 0) {
      chip.classList.add("active");
      displayFlawDetail(flaw);
    }
  });
}

function displayFlawDetail(flaw) {
  cardFlawType.textContent = flaw.flaw_type.replace('_', ' ');
  cardFlawInterval.textContent = `[${flaw.start_sec}s - ${flaw.end_sec}s | Duration: ${flaw.duration_sec}s]`;
  
  cardSeverity.textContent = `SEVERITY: ${flaw.severity}`;
  cardSeverity.className = "rubber-stamp text-[10px] font-bold " + 
    (flaw.severity === "CRITICAL" ? "text-[#991b1b] border-[#991b1b]" :
     flaw.severity === "HIGH" ? "text-[#cb4914] border-[#cb4914]" :
     "text-[#d97706] border-[#d97706]");

  cardMathProof.textContent = flaw.mathematical_proof || "--";
  cardPhrase.textContent = `"${flaw.affected_phrase || 'N/A'}"`;
  cardCausal.textContent = flaw.causal_explanation || "--";
  cardCoaching.textContent = flaw.coaching_recommendation || "--";

  // Highlight words overlapping with this active flaw
  const fStart = Number(flaw.start_sec ?? 0);
  const fEnd = Number(flaw.end_sec ?? 0);
  document.querySelectorAll(".word-chip").forEach((chip) => {
    const wStart = parseFloat(chip.dataset.start);
    const wEnd = parseFloat(chip.dataset.end);
    if (!isNaN(wStart) && !isNaN(wEnd) && Math.max(wStart, fStart) < Math.min(wEnd, fEnd)) {
      chip.classList.add("active-flaw");
    } else {
      chip.classList.remove("active-flaw");
    }
  });
}

function clearCausalCard() {
  cardFlawType.textContent = "NO FLAWS DETECTED";
  cardFlawInterval.textContent = "[0.0s - 0.0s]";
  cardSeverity.textContent = "PERFECT ORATORY";
  cardSeverity.className = "rubber-stamp text-[10px] font-bold text-[#37613d] border-[#37613d]";
  cardMathProof.textContent = "Delta_Acoustic <= Epsilon across all temporal frames";
  cardPhrase.textContent = '"Complete Utterance"';
  cardCausal.textContent = "Acoustic envelope matches master baseline standards with optimal dynamic modulation, steady tempo, and disciplined pauses.";
  cardCoaching.textContent = "Continue maintaining this high standard of vocal control and rhetorical cadence.";

  document.querySelectorAll(".word-chip").forEach((chip) => {
    chip.classList.remove("active-flaw");
  });
}

function switchMetricView(metric) {
  currentMetricView = metric;
  [btnViewPitch, btnViewEnergy, btnViewRate].forEach(btn => {
    btn.classList.remove("bg-[#cb4914]", "text-white");
    btn.classList.add("bg-white", "text-[#1e1b19]");
  });

  if (metric === "pitch") {
    btnViewPitch.classList.add("bg-[#cb4914]", "text-white");
    btnViewPitch.classList.remove("bg-white", "text-[#1e1b19]");
  } else if (metric === "energy") {
    btnViewEnergy.classList.add("bg-[#cb4914]", "text-white");
    btnViewEnergy.classList.remove("bg-white", "text-[#1e1b19]");
  } else {
    btnViewRate.classList.add("bg-[#cb4914]", "text-white");
    btnViewRate.classList.remove("bg-white", "text-[#1e1b19]");
  }

  renderChart();
}

function renderChart() {
  if (!currentData || !currentData.visualization) return;

  const vis = currentData.visualization;
  const ctx = document.getElementById("timeSeriesChart").getContext("2d");

  let baseData, testData, yLabel;
  if (currentMetricView === "pitch") {
    baseData = vis.base_pitch_semitones;
    testData = vis.test_pitch_semitones;
    yLabel = "Semitones (Relative to Median F0)";
  } else if (currentMetricView === "energy") {
    baseData = vis.base_energy;
    testData = vis.test_energy;
    yLabel = "Normalized RMS Energy [0 - 1]";
  } else {
    baseData = vis.base_rate;
    testData = vis.test_rate;
    yLabel = "Relative Speech Rate (v / v_mean)";
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: vis.timestamps,
      datasets: [
        {
          label: "Baseline Master (Reference)",
          data: baseData,
          borderColor: "#1e3a8a",
          backgroundColor: "rgba(30, 58, 138, 0.08)",
          borderWidth: 2.5,
          pointRadius: 0,
          tension: 0.25,
          spanGaps: true
        },
        {
          label: "Evaluated Audio Spectrum",
          data: testData,
          borderColor: "#cb4914",
          backgroundColor: "rgba(203, 73, 20, 0.08)",
          borderWidth: 2.5,
          pointRadius: 0,
          tension: 0.25,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#1e1b19',
            font: { family: "'Space Mono', monospace", size: 10, weight: 'bold' }
          }
        },
        tooltip: {
          backgroundColor: "#fffdfa",
          titleColor: "#1e1b19",
          bodyColor: "#594139",
          borderColor: "#1e1b19",
          borderWidth: 2,
          padding: 8,
          bodyFont: { family: "'Space Mono', monospace", size: 11 },
          titleFont: { family: "'Space Mono', monospace", size: 11, weight: 'bold' },
          callbacks: {
            title: (items) => `Time: ${items[0].label}s`
          }
        }
      },
      scales: {
        x: {
          grid: { color: "#f0e6de" },
          ticks: { color: "#594139", font: { family: "'Space Mono', monospace", size: 10 }, maxTicksLimit: 12 }
        },
        y: {
          title: {
            display: true,
            text: yLabel,
            color: "#594139",
            font: { family: "'Space Mono', monospace", size: 10, weight: 'bold' }
          },
          grid: { color: "#f0e6de" },
          ticks: { color: "#594139", font: { family: "'Space Mono', monospace", size: 10 } }
        }
      },
      onClick: (e, elements) => {
        if (elements && elements.length > 0) {
          const index = elements[0].index;
          const time = vis.timestamps[index];
          if (time !== undefined) {
            audioTest.currentTime = time;
          }
        }
      }
    }
  });
}

// -------------------------------------------------------------
// Formant 2D Scatter Chart (View 3: Corpus Benchmark)
// -------------------------------------------------------------
function renderFormantScatterChart() {
  const canvas = document.getElementById("formantScatterChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const baselinePoints = [
    { x: 1680, y: 540, label: "JFK Inaugural (Master Reference)" },
    { x: 1520, y: 490, label: "MLK Dream (Master Reference)" },
    { x: 1610, y: 510, label: "Steve Jobs (Master Reference)" },
    { x: 1380, y: 460, label: "Churchill Fight (Master Reference)" },
    { x: 1720, y: 530, label: "Multimodal AI Keynote" }
  ];

  const centralizedPoints = [
    { x: 1505, y: 502, label: "Tier 4 Botched (Centralized Schwa)" },
    { x: 1485, y: 492, label: "Tier 3 Severe (Monotone Collapse)" },
    { x: 1550, y: 515, label: "Tier 2 Moderate (Mild Centralization)" }
  ];

  const datasets = [
    {
      label: "Master Baseline Vowel Space (Expanded)",
      data: baselinePoints,
      backgroundColor: "#0284c7",
      borderColor: "#1e1b19",
      borderWidth: 1.5,
      pointRadius: 7,
      pointHoverRadius: 9
    },
    {
      label: "Dysprosodic Centralized Under-shoot",
      data: centralizedPoints,
      backgroundColor: "#d97706",
      borderColor: "#1e1b19",
      borderWidth: 1.5,
      pointRadius: 6,
      pointHoverRadius: 8
    }
  ];

  if (currentData && currentData.forensics && currentData.forensics.test && currentData.forensics.test.f1_mean_hz) {
    const f1 = currentData.forensics.test.f1_mean_hz;
    const f2 = currentData.forensics.test.f2_mean_hz;
    datasets.push({
      label: "Active Evaluated Recording",
      data: [{ x: f2, y: f1, label: "Your Evaluated Voice" }],
      backgroundColor: "#cb4914",
      borderColor: "#1e1b19",
      borderWidth: 2,
      pointRadius: 10,
      pointHoverRadius: 12
    });
  }

  if (formantChartInstance) {
    formantChartInstance.destroy();
  }

  formantChartInstance = new Chart(ctx, {
    type: "scatter",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: "#1e1b19",
            font: { family: "'Space Mono', monospace", size: 10, weight: 'bold' }
          }
        },
        tooltip: {
          backgroundColor: "#fffdfa",
          titleColor: "#1e1b19",
          bodyColor: "#594139",
          borderColor: "#1e1b19",
          borderWidth: 2,
          padding: 8,
          bodyFont: { family: "'Space Mono', monospace", size: 11 },
          titleFont: { family: "'Space Mono', monospace", size: 11, weight: 'bold' },
          callbacks: {
            title: (items) => {
              const item = items[0];
              const pt = item.raw;
              return pt.label || "Acoustic Coordinate";
            },
            label: (item) => `F1: ${item.raw.y} Hz (Height) | F2: ${item.raw.x} Hz (Backness)`
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Formant F2 — Tongue Advancement / Backness (Hz)",
            color: "#594139",
            font: { family: "'Space Mono', monospace", size: 11, weight: 'bold' }
          },
          min: 1200,
          max: 1900,
          grid: { color: "#f0e6de" },
          ticks: { color: "#594139", font: { family: "'Space Mono', monospace", size: 10 } }
        },
        y: {
          title: {
            display: true,
            text: "Formant F1 — Jaw Aperture / Height (Hz)",
            color: "#594139",
            font: { family: "'Space Mono', monospace", size: 11, weight: 'bold' }
          },
          min: 400,
          max: 600,
          grid: { color: "#f0e6de" },
          ticks: { color: "#594139", font: { family: "'Space Mono', monospace", size: 10 } }
        }
      }
    }
  });
}

async function webmToWavBlob(blob) {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtxClass();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    audioCtx.close();
    return audioBufferToWavBlob(audioBuffer);
  } catch (err) {
    console.warn("PCM conversion fallback:", err);
    return blob;
  }
}

function audioBufferToWavBlob(audioBuffer) {
  const numChannels = 1;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let monoChannel;
  if (audioBuffer.numberOfChannels === 1) {
    monoChannel = audioBuffer.getChannelData(0);
  } else {
    monoChannel = new Float32Array(audioBuffer.length);
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    for (let i = 0; i < audioBuffer.length; i++) {
      monoChannel[i] = (left[i] + right[i]) / 2;
    }
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = monoChannel.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");

  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < monoChannel.length; i++) {
    let s = Math.max(-1, Math.min(1, monoChannel[i]));
    let intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function renderMath() {
  if (typeof renderMathInElement === "function") {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false
    });
  }
}

window.addEventListener("DOMContentLoaded", init);
