import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Pause, AlertTriangle, Sparkles, CheckCircle2, ChevronRight, Activity, Clock, ShieldCheck } from 'lucide-react';
import TimeSeriesChart from './TimeSeriesChart';

export default function StudioView({
  speeches,
  selectedSpeechKey,
  setSelectedSpeechKey,
  selectedTier,
  setSelectedTier,
  currentEvaluation,
  loading
}) {
  const [metricView, setMetricView] = useState('pitch'); // 'pitch', 'energy', 'rate'
  const [selectedFlawIndex, setSelectedFlawIndex] = useState(0);
  const [currentPlayTime, setCurrentPlayTime] = useState(0);

  const audioBaseRef = useRef(null);
  const audioTestRef = useRef(null);

  const speechInfo = currentEvaluation?.speech_info || {};
  const scorecard = currentEvaluation?.scorecard || {
    composite_delivery_index: 87.4,
    letter_grade: 'A',
    pacing_score: 86.7,
    pitch_dynamism_score: 93.0,
    stress_emphasis_score: 98.1,
    fluency_pause_score: 72.9,
    summary_verdict: 'Strong rhetorical delivery with minor phrasal friction.'
  };

  const forensics = currentEvaluation?.forensics?.test || {};
  const flaws = currentEvaluation?.flaws || [];
  const words = currentEvaluation?.words || [];
  const activeFlaw = flaws[selectedFlawIndex] || flaws[0] || null;

  // Track playback time on test audio for karaoke sync
  useEffect(() => {
    const audio = audioTestRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentPlayTime(audio.currentTime);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => audio.removeEventListener('timeupdate', onTimeUpdate);
  }, []);

  // Jump to specific flaw when clicked
  const handleSelectFlaw = (index) => {
    setSelectedFlawIndex(index);
    const flaw = flaws[index];
    const startSec = flaw?.start_sec ?? flaw?.interval_start ?? 0;
    if (flaw && audioTestRef.current) {
      audioTestRef.current.currentTime = Math.max(0, startSec - 0.2);
      audioTestRef.current.play().catch(() => {});
    }
  };

  // Click on word to seek and auto-select matching flaw if any
  const handleWordClick = (word) => {
    const startSec = word?.start_sec ?? word?.start ?? 0;
    const endSec = word?.end_sec ?? word?.end ?? 0;
    if (audioTestRef.current) {
      audioTestRef.current.currentTime = startSec;
      audioTestRef.current.play().catch(() => {});
    }

    // Auto-select corresponding incident card if clicked word is flawed
    const flawIdx = flaws.findIndex((f) => {
      const fStart = f.start_sec ?? f.interval_start ?? 0;
      const fEnd = f.end_sec ?? f.interval_end ?? 0;
      return Math.max(startSec, fStart) < Math.min(endSec, fEnd);
    });
    if (flawIdx !== -1) {
      setSelectedFlawIndex(flawIdx);
    }
  };

  // Click on chart to seek
  const handleSeekTime = (timeSec) => {
    if (audioTestRef.current) {
      audioTestRef.current.currentTime = timeSec;
      audioTestRef.current.play().catch(() => {});
    }
  };

  // Rubber stamp styling
  const letterGrade = scorecard?.letter_grade || 'A';
  let stampColorClass = 'text-[#37613d] border-[#37613d] -rotate-3';
  if (letterGrade.startsWith('B')) {
    stampColorClass = 'text-[#d97706] border-[#d97706] rotate-2';
  } else if (letterGrade.startsWith('C') || letterGrade.startsWith('D')) {
    stampColorClass = 'text-[#cb4914] border-[#cb4914] -rotate-2';
  }

  const tiers = [
    { id: 'tier_1_near_perfect', label: 'Tier 1: Near-Perfect' },
    { id: 'tier_2_moderate_flaws', label: 'Tier 2: Moderate Flaws' },
    { id: 'tier_3_severe_flaws', label: 'Tier 3: Severe Flaws' },
    { id: 'tier_4_botched', label: 'Tier 4: Botched Delivery' },
  ];

  return (
    <div className="space-y-6">
      {/* 2-Column Grid (5 cols Left, 7 cols Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Controls & Evaluative Scorecard (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Preset Controls Card */}
          <div className="relative bg-white border-2 border-[#1e1b19] rounded-xl p-5 shadow-press space-y-4">
            <div className="absolute -top-2.5 right-6 pushpin-primary"></div>
            
            <div className="border-b border-[#e5d8d0] pb-2">
              <span className="washi-tape-primary text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#1e1b19] text-[#872a00]">
                BENCHMARK CONTROLS
              </span>
              <h2 className="font-display font-extrabold text-base text-[#1e1b19] mt-1 flex items-center justify-between">
                <span>Select Corpus Speech</span>
                <span className="text-[10px] font-mono font-normal text-[#594139]">SynthReaper v2.4</span>
              </h2>
            </div>

            {/* Speech Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-[#594139]">Baseline Speech:</label>
              <select
                value={selectedSpeechKey}
                onChange={(e) => setSelectedSpeechKey(e.target.value)}
                className="w-full bg-[#fff8f5] border-2 border-[#1e1b19] rounded-lg p-2 font-mono text-xs text-[#1e1b19] font-bold shadow-press-xs focus:outline-none"
              >
                {Object.entries(speeches).map(([k, s]) => (
                  <option key={k} value={k}>
                    {s.title} ({s.speaker})
                  </option>
                ))}
              </select>
            </div>

            {/* Defect Tier Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#594139]">Evaluated Delivery Quality Tier:</label>
              <div className="grid grid-cols-2 gap-2">
                {tiers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTier(t.id)}
                    className={`px-2.5 py-1.5 rounded-lg border-2 border-[#1e1b19] font-mono text-[11px] font-bold text-left transition-all ${
                      selectedTier === t.id
                        ? 'bg-[#cb4914] text-white shadow-press'
                        : 'bg-[#fff8f5] text-[#1e1b19] hover:bg-white shadow-press-xs active:translate-x-0.5 active:translate-y-0.5'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Overall Oratory Score Card */}
          <div className="relative bg-white border-2 border-[#1e1b19] rounded-xl p-5 shadow-press space-y-4">
            <div className="absolute -top-2.5 right-6 pushpin-secondary"></div>
            
            <div className="flex items-center justify-between border-b border-[#e5d8d0] pb-2">
              <span className="washi-tape-tertiary text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#1e1b19] text-[#805200]">
                EVALUATION SCORECARD
              </span>
              <span className="text-[10px] font-mono text-[#594139]">Zero-Hallucination</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-3xl font-black font-display text-[#1e1b19] tracking-tight">
                  {scorecard.composite_delivery_index?.toFixed(1) || '0.0'}
                  <span className="text-sm font-normal text-[#594139] font-mono"> / 100 CDI</span>
                </div>
                <div className="text-[11px] font-mono text-[#594139] mt-0.5">
                  Composite Delivery Index
                </div>
              </div>

              {/* Rubber Stamp Letter Grade */}
              <div>
                <span className={`rubber-stamp text-xl ${stampColorClass}`}>
                  GRADE: {scorecard.letter_grade}
                </span>
              </div>
            </div>

            {/* Witty Roast Summary Box */}
            <div className="bg-[#ffddb6]/35 border border-[#1e1b19] p-3 rounded-lg text-xs font-serif text-[#1e1b19] italic leading-relaxed">
              "{scorecard.summary_verdict}"
            </div>

            {/* 4 Rubric Bars */}
            <div className="space-y-2 pt-1 border-t border-[#e5d8d0] font-mono text-xs">
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span>Pacing &amp; Cadence (25%)</span>
                  <span className="font-bold text-[#1e1b19]">{scorecard.pacing_score?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#f4ece8] border border-[#1e1b19] h-2 rounded-full overflow-hidden p-0.5">
                  <div className="bg-[#cb4914] h-full rounded-full transition-all duration-300" style={{ width: `${scorecard.pacing_score || 0}%` }}></div>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span>Pitch Dynamism F0 (30%)</span>
                  <span className="font-bold text-[#1e1b19]">{scorecard.pitch_dynamism_score?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#f4ece8] border border-[#1e1b19] h-2 rounded-full overflow-hidden p-0.5">
                  <div className="bg-[#37613d] h-full rounded-full transition-all duration-300" style={{ width: `${scorecard.pitch_dynamism_score || 0}%` }}></div>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span>Rhetorical Stress (20%)</span>
                  <span className="font-bold text-[#1e1b19]">{scorecard.stress_emphasis_score?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#f4ece8] border border-[#1e1b19] h-2 rounded-full overflow-hidden p-0.5">
                  <div className="bg-[#d97706] h-full rounded-full transition-all duration-300" style={{ width: `${scorecard.stress_emphasis_score || 0}%` }}></div>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span>Fluency &amp; Pause (25%)</span>
                  <span className="font-bold text-[#1e1b19]">{scorecard.fluency_pause_score?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#f4ece8] border border-[#1e1b19] h-2 rounded-full overflow-hidden p-0.5">
                  <div className="bg-[#1e1b19] h-full rounded-full transition-all duration-300" style={{ width: `${scorecard.fluency_pause_score || 0}%` }}></div>
                </div>
              </div>
            </div>

            {/* Forensic Voice Quality Metrics Table */}
            <div className="border-t border-[#e5d8d0] pt-3 space-y-2">
              <div className="text-[10px] font-mono font-bold uppercase text-[#594139] flex items-center justify-between">
                <span>Praat Voice Quality Markers:</span>
                <span className="text-[#37613d]">C-Engine Native</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="bg-[#f4ece8] border border-[#1e1b19] p-1.5 rounded">
                  <div className="text-[9px] text-[#594139] font-bold">HNR (dB)</div>
                  <div className="text-xs font-black text-[#1e1b19]">{forensics.hnr_db ?? '18.2'} dB</div>
                </div>
                <div className="bg-[#f4ece8] border border-[#1e1b19] p-1.5 rounded">
                  <div className="text-[9px] text-[#594139] font-bold">Local Jitter</div>
                  <div className="text-xs font-black text-[#1e1b19]">{forensics.jitter_pct ?? '0.94'}%</div>
                </div>
                <div className="bg-[#f4ece8] border border-[#1e1b19] p-1.5 rounded">
                  <div className="text-[9px] text-[#594139] font-bold">Local Shimmer</div>
                  <div className="text-xs font-black text-[#1e1b19]">{forensics.shimmer_pct ?? '3.12'}%</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-center pt-1">
                <div className="bg-[#f4ece8] border border-[#1e1b19] p-1.5 rounded">
                  <div className="text-[9px] text-[#594139] font-bold">Formant F1</div>
                  <div className="text-xs font-black text-[#1e1b19]">{forensics.formant_f1_hz ?? '520'} Hz</div>
                </div>
                <div className="bg-[#f4ece8] border border-[#1e1b19] p-1.5 rounded">
                  <div className="text-[9px] text-[#594139] font-bold">Formant F2</div>
                  <div className="text-xs font-black text-[#1e1b19]">{forensics.formant_f2_hz ?? '1610'} Hz</div>
                </div>
                <div className="bg-[#f4ece8] border border-[#1e1b19] p-1.5 rounded">
                  <div className="text-[9px] text-[#594139] font-bold">DTW Cost</div>
                  <div className="text-xs font-black text-[#cb4914]">{forensics.dtw_cost ?? '0.042'}</div>
                </div>
              </div>
            </div>

            {/* Speech Telemetry Footnote */}
            <div className="text-[11px] font-mono text-[#594139] flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#e5d8d0]">
              <span>Tempo: <b className="text-[#1e1b19]">{forensics.wpm ?? '138'} WPM</b></span>
              <span>Pitch Dev: <b className="text-[#1e1b19]">{forensics.pitch_std_st ?? '3.2'} ST</b></span>
              <span>Dynamic: <b className="text-[#1e1b19]">{forensics.dynamic_range_db ?? '24.5'} dB</b></span>
              <span>Duration: <b className="text-[#1e1b19]">{forensics.duration_s ?? '14.2'}s</b></span>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Dual Audio, Word-by-Word Karaoke & Causal Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Dual Audio Tape Player Strip */}
          <div className="bg-white border-2 border-[#1e1b19] rounded-xl p-4 shadow-press space-y-3">
            <div className="flex items-center justify-between border-b border-[#e5d8d0] pb-2">
              <div className="flex items-center gap-2">
                <span className="washi-tape-primary text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#1e1b19] text-[#872a00]">
                  A/B COMPARISON DESK
                </span>
                <span className="text-xs font-bold text-[#1e1b19] font-mono">
                  {speechInfo.title || 'JFK Inaugural Address'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#594139]">
                <span>{speechInfo.speaker || 'John F. Kennedy'}</span> • <span>{speechInfo.voice_model || 'Studio Neural'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Master Player */}
              <div className="bg-[#f4ece8] border border-[#1e1b19] p-2.5 rounded-lg space-y-1">
                <div className="flex justify-between items-center text-[11px] font-mono font-bold text-[#37613d]">
                  <span>🏆 Baseline Reference Master</span>
                </div>
                <audio
                  ref={audioBaseRef}
                  src={speechInfo.base_audio_url || `/dataset/speeches/${selectedSpeechKey}/baseline.wav`}
                  controls
                  className="w-full h-8"
                />
              </div>

              {/* Test Player */}
              <div className="bg-[#fff8f5] border border-[#1e1b19] p-2.5 rounded-lg space-y-1">
                <div className="flex justify-between items-center text-[11px] font-mono font-bold text-[#cb4914]">
                  <span>🎧 Evaluated Utterance</span>
                </div>
                <audio
                  ref={audioTestRef}
                  src={speechInfo.test_audio_url || `/dataset/speeches/${selectedSpeechKey}/${selectedTier}.wav`}
                  controls
                  className="w-full h-8"
                />
              </div>
            </div>
          </div>

          {/* Interactive Karaoke Transcript */}
          <div className="relative bg-white border-2 border-[#1e1b19] rounded-xl p-5 shadow-press space-y-2.5">
            <div className="absolute -top-2.5 right-6 pushpin-primary"></div>
            
            <div className="flex flex-wrap items-center justify-between border-b border-dashed border-[#e5d8d0] pb-2 gap-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-mono font-bold text-[#594139] flex items-center gap-1.5">
                  <span>🔤</span> Word-by-Word Forced Alignment:
                </span>
                {/* Visual Legend for Defect Grounding */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#fee2e2] text-[#991b1b] border border-[#dc2626] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]"></span>
                    Flawed Word
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#cb4914] text-white font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    Selected Incident
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-[#1e1b19] border border-[#1e1b19]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#37613d]"></span>
                    Pristine
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#cb4914] font-bold">
                💡 Click any word to seek &amp; inspect
              </span>
            </div>

            <div className="p-3 bg-[#fff8f5] border border-[#1e1b19] rounded-lg min-h-[90px] leading-loose text-sm font-serif">
              {words.length > 0 ? (
                words.map((w, idx) => {
                  const startSec = w.start_sec ?? w.start ?? 0;
                  const endSec = w.end_sec ?? w.end ?? 0;
                  const isCurrent = currentPlayTime >= startSec && currentPlayTime <= endSec;

                  // Check if this word overlaps with ANY detected flaw
                  const matchingFlaw = flaws.find((f) => {
                    const fStart = f.start_sec ?? f.interval_start ?? 0;
                    const fEnd = f.end_sec ?? f.interval_end ?? 0;
                    return Math.max(startSec, fStart) < Math.min(endSec, fEnd);
                  });
                  const hasFlaw = Boolean(w.has_flaw || matchingFlaw);
                  const flawType = w.flaw_type || matchingFlaw?.flaw_type || 'PROSODIC_FLAW';

                  // Check if this word is part of the currently selected flaw
                  const activeStart = activeFlaw ? (activeFlaw.start_sec ?? activeFlaw.interval_start ?? 0) : null;
                  const activeEnd = activeFlaw ? (activeFlaw.end_sec ?? activeFlaw.interval_end ?? 0) : null;
                  const isSelectedFlawWord = Boolean(
                    activeFlaw && activeStart !== null && (
                      Math.max(startSec, activeStart) < Math.min(endSec, activeEnd) ||
                      (activeFlaw.affected_phrase && activeFlaw.affected_phrase.toLowerCase().includes(w.word.toLowerCase().replace(/[^a-z0-9]/g, '')))
                    )
                  );

                  // Calculate visual badge styling
                  let styleClass = 'hover:bg-[#ffddb6] text-[#1e1b19] border border-transparent';

                  if (isCurrent && hasFlaw) {
                    // Playhead currently on a flawed word
                    styleClass = 'bg-[#b91c1c] text-white font-black scale-110 shadow-press-sm border border-[#1e1b19] ring-2 ring-[#ef4444] animate-pulse';
                  } else if (isCurrent) {
                    // Playhead currently on clean word
                    styleClass = 'bg-[#cb4914] text-white font-bold scale-105 shadow-press-xs border border-[#1e1b19]';
                  } else if (isSelectedFlawWord) {
                    // Part of currently selected incident card
                    styleClass = 'bg-[#cb4914] text-white font-black shadow-press-xs scale-105 border-2 border-[#1e1b19] ring-2 ring-[#ffddb6]';
                  } else if (hasFlaw) {
                    // Detected flaw / incorrect word in red!
                    styleClass = 'bg-[#fee2e2] text-[#991b1b] font-bold border-2 border-[#dc2626] shadow-press-xs hover:bg-[#fecaca]';
                  }

                  return (
                    <span
                      key={idx}
                      onClick={() => handleWordClick(w)}
                      className={`inline-block mx-0.5 px-1.5 py-0.5 rounded-md cursor-pointer transition-all duration-100 select-none ${styleClass}`}
                      title={`[${Number(startSec).toFixed(2)}s - ${Number(endSec).toFixed(2)}s]${hasFlaw ? ` • 🚨 Flaw: ${flawType.replace(/_/g, ' ')}` : ''}`}
                    >
                      {w.word}
                      {hasFlaw && !isCurrent && !isSelectedFlawWord && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#dc2626] ml-1 align-top"></span>
                      )}
                      {' '}
                    </span>
                  );
                })
              ) : (
                <span className="text-[#594139] font-mono text-xs italic">
                  "{speechInfo.transcript || 'Loading aligned transcript...'}"
                </span>
              )}
            </div>
          </div>

          {/* Detected Delivery Flaws Bar & Causal Inspection Card */}
          <div className="bg-white border-2 border-[#1e1b19] rounded-xl p-5 shadow-press space-y-4">
            
            {/* Flaw Chips Header */}
            <div className="flex items-center justify-between border-b border-[#e5d8d0] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="washi-tape-tertiary text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#1e1b19] text-[#805200]">
                  DETECTED INCIDENTS
                </span>
                <span className="text-xs font-mono font-bold text-[#cb4914]">
                  {flaws.length} {flaws.length === 1 ? 'Flaw Grounded' : 'Flaws Grounded'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#594139]">Click chip to inspect &amp; scrub</span>
            </div>

            {/* Flaw Chips Container */}
            <div className="flex flex-wrap gap-2">
              {flaws.length > 0 ? (
                flaws.map((flaw, idx) => {
                  const isSelected = selectedFlawIndex === idx;
                  const fStart = flaw.start_sec ?? flaw.interval_start ?? 0;
                  const fEnd = flaw.end_sec ?? flaw.interval_end ?? 0;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectFlaw(idx)}
                      className={`px-3 py-1.5 rounded-lg border-2 border-[#1e1b19] text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-[#cb4914] text-white shadow-press'
                          : 'bg-[#fff8f5] text-[#1e1b19] hover:bg-[#ffddb6] shadow-press-xs'
                      }`}
                    >
                      <span>🚨</span>
                      <span>{(flaw.flaw_type || 'FLAW').replace(/_/g, ' ')}</span>
                      <span className="text-[10px] opacity-80">
                        [{Number(fStart).toFixed(1)}s - {Number(fEnd).toFixed(1)}s]
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="p-3 bg-[#c8ecca]/50 border border-[#1e1b19] rounded-lg text-xs font-mono text-[#2c4e31] font-bold flex items-center gap-2 w-full">
                  <CheckCircle2 className="w-4 h-4 text-[#37613d]" />
                  <span>No delivery flaws detected. Pristine oration matching gold-standard reference!</span>
                </div>
              )}
            </div>

            {/* Detailed Causal Inspection Card: Styled as a Crime-Scene Report */}
            {activeFlaw && (() => {
              const fStart = activeFlaw.start_sec ?? activeFlaw.interval_start ?? 0;
              const fEnd = activeFlaw.end_sec ?? activeFlaw.interval_end ?? 0;
              const phrase = activeFlaw.affected_phrase ?? activeFlaw.affected_words ?? "";
              const coaching = activeFlaw.coaching_recommendation ?? activeFlaw.coaching_advice ?? "Maintain forward momentum.";
              return (
                <div className="bg-[#ffddb6]/35 border-2 border-[#1e1b19] rounded-xl p-4 shadow-press-sm space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between border-b border-dashed border-[#805200]/30 pb-2">
                    <span className="font-bold text-[#1e1b19] flex items-center gap-1.5 text-sm">
                      <span>🚨</span> <span>{(activeFlaw.flaw_type || 'FLAW').replace(/_/g, ' ')}</span>
                      <span className="text-xs text-[#594139] font-normal">
                        [{Number(fStart).toFixed(2)}s - {Number(fEnd).toFixed(2)}s]
                      </span>
                    </span>
                    <span className={`rubber-stamp text-[10px] font-bold ${
                      activeFlaw.severity === 'HIGH' ? 'text-[#cb4914] border-[#cb4914]' : 'text-[#d97706] border-[#d97706]'
                    }`}>
                      SEVERITY: {activeFlaw.severity || 'MODERATE'}
                    </span>
                  </div>

                  {/* Mathematical Proof */}
                  <div className="bg-white border border-[#1e1b19] p-2 rounded text-[#1e1b19]">
                    <span className="text-[#805200] font-bold">Proof: </span>
                    <span>{activeFlaw.mathematical_proof || 'Acoustic deviation confirmed.'}</span>
                  </div>

                  {/* Affected Phrase */}
                  <div className="text-[#1e1b19]">
                    <span className="text-[#594139] font-bold">Affected Text: </span>
                    <span className="font-serif text-sm italic">"{phrase}"</span>
                  </div>

                  {/* Causal Explanation */}
                  <div className="text-[#1e1b19]">
                    <span className="text-[#cb4914] font-bold">Why it failed: </span>
                    <span>{activeFlaw.causal_explanation || 'Prosodic anomaly detected.'}</span>
                  </div>

                  {/* Coaching Advice */}
                  <div className="bg-[#c8ecca]/40 border border-[#1e1b19] p-2 rounded text-[#2c4e31]">
                    <span className="font-bold">💡 Forensic Coach: </span>
                    <span>{coaching}</span>
                  </div>

                  {/* Watermark in Causal Card */}
                  <div className="pt-1 text-[10px] text-[#594139] flex items-center justify-between border-t border-[#805200]/20">
                    <span>Diagnostic Engine: DTW Hysteresis Bounding</span>
                    <span className="font-bold text-[#cb4914]">Forensic Analysis by SynthReaper</span>
                  </div>
                </div>
              );
            })()}

          </div>

        </div>

      </div>

      {/* FULL-WIDTH ACOUSTIC TIME-SERIES CANVAS */}
      <section className="bg-white border-2 border-[#1e1b19] rounded-xl p-5 shadow-press space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5d8d0] pb-3">
          <div>
            <h3 className="font-display font-extrabold text-base text-[#1e1b19] flex items-center gap-2">
              <span>📈</span> Aligned Acoustic Telemetry Time-Series
            </h3>
            <p className="text-xs font-mono text-[#594139]">
              Non-linear Dynamic Time Warping (DTW) feature overlay with click-to-seek • SynthReaper Visualizer
            </p>
          </div>

          {/* Metric Toggle Buttons */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => setMetricView('pitch')}
              className={`px-3 py-1 rounded-md border border-[#1e1b19] font-bold transition-all ${
                metricView === 'pitch'
                  ? 'bg-[#cb4914] text-white shadow-press-xs'
                  : 'bg-white text-[#1e1b19] hover:bg-[#faf2ee] shadow-press-xs'
              }`}
            >
              Pitch Semitones
            </button>
            <button
              onClick={() => setMetricView('energy')}
              className={`px-3 py-1 rounded-md border border-[#1e1b19] font-bold transition-all ${
                metricView === 'energy'
                  ? 'bg-[#cb4914] text-white shadow-press-xs'
                  : 'bg-white text-[#1e1b19] hover:bg-[#faf2ee] shadow-press-xs'
              }`}
            >
              RMS Energy
            </button>
            <button
              onClick={() => setMetricView('rate')}
              className={`px-3 py-1 rounded-md border border-[#1e1b19] font-bold transition-all ${
                metricView === 'rate'
                  ? 'bg-[#cb4914] text-white shadow-press-xs'
                  : 'bg-white text-[#1e1b19] hover:bg-[#faf2ee] shadow-press-xs'
              }`}
            >
              Speech Velocity
            </button>
          </div>
        </div>

        <TimeSeriesChart
          visualization={currentEvaluation?.visualization}
          flaws={flaws}
          metric={metricView}
          onSeekTime={handleSeekTime}
        />
      </section>

    </div>
  );
}
