"""
pipeline.py: End-to-end contrastive speech analytics pipeline.
Unifies feature extraction, Praat voice forensics, DTW sequence alignment,
word-level forced alignment, temporal flaw grounding, causal rationale generation, and rubric scoring.
"""

import os
import json
from dataclasses import asdict
import numpy as np
import soundfile as sf
import librosa

from src.speech_analytics.feature_extractor import AcousticFeatureExtractor, AcousticFeatures
from src.speech_analytics.speaker_normalizer import SpeakerNormalizer
from src.speech_analytics.aligner import SequenceAligner, AlignmentResult
from src.speech_analytics.flaw_detector import TemporalFlawDetector, GroundedFlaw
from src.speech_analytics.rubric_scorer import RubricScorer, RubricScorecard


class SpeechAnalyticsPipeline:
    """Master orchestrator for speech evaluation and temporal flaw grounding."""
    
    def __init__(self, sample_rate: int = 22050):
        self.sr = sample_rate
        self.extractor = AcousticFeatureExtractor(sample_rate=sample_rate)
        self.aligner = SequenceAligner()
        self.detector = TemporalFlawDetector()
        
    def load_audio(self, source) -> np.ndarray:
        """Loads audio from file path, bytes, or existing numpy array."""
        if isinstance(source, str):
            audio, sr = librosa.load(source, sr=self.sr, mono=True)
            return audio
        elif isinstance(source, (bytes, bytearray)):
            import io
            import tempfile
            try:
                audio, sr = sf.read(io.BytesIO(source))
            except Exception:
                # Fallback to temp file decoding via librosa/audioread
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                    tmp.write(source)
                    tmp_path = tmp.name
                try:
                    audio, sr = librosa.load(tmp_path, sr=self.sr, mono=True)
                finally:
                    if os.path.exists(tmp_path):
                        try:
                            os.remove(tmp_path)
                        except Exception:
                            pass
                return audio.astype(np.float32)

            if audio.ndim > 1:
                audio = np.mean(audio, axis=1)
            if sr != self.sr:
                audio = librosa.resample(audio, orig_sr=sr, target_sr=self.sr)
            return audio.astype(np.float32)
        elif isinstance(source, np.ndarray):
            if source.ndim > 1:
                source = np.mean(source, axis=1)
            return source.astype(np.float32)
        else:
            raise ValueError(f"Unsupported audio source type: {type(source)}")

    def evaluate(self, base_audio_source, test_audio_source, transcript: str = "", word_boundaries: list[dict] = None) -> dict:
        """
        Executes complete contrastive evaluation between baseline and participant audio.
        """
        base_audio = self.load_audio(base_audio_source)
        test_audio = self.load_audio(test_audio_source)
        
        # 1. Feature Extraction with Praat forensics
        base_feat = self.extractor.process(base_audio)
        test_feat = self.extractor.process(test_audio)
        
        # 2. Sequence Alignment via DTW
        alignment = self.aligner.align(base_feat, test_feat)
        
        # 3. Temporal Flaw Grounding & Causal Explainability
        flaws = self.detector.analyze(alignment, base_feat, test_feat, transcript=transcript)
        
        # 4. Evaluative Rubric Scoring
        scorecard = RubricScorer.calculate_scores(base_feat, test_feat, alignment, flaws)
        
        # 5. Format Downsampled Time-Series for Web Visualizer (max 380 points)
        n_points = len(alignment.test_times)
        step = max(1, n_points // 350)
        
        times_sub = [round(float(t), 2) for t in alignment.test_times[::step]]
        test_pitch_sub = [
            None if np.isnan(p) else round(float(p), 2)
            for p in alignment.test_pitch[::step]
        ]
        base_pitch_sub = [
            None if np.isnan(p) else round(float(p), 2)
            for p in alignment.base_pitch_aligned[::step]
        ]
        test_energy_sub = [
            None if np.isnan(e) else round(float(e), 2)
            for e in alignment.test_energy[::step]
        ]
        base_energy_sub = [
            None if np.isnan(e) else round(float(e), 2)
            for e in alignment.base_energy_aligned[::step]
        ]
        test_rate_sub = [
            round(float(r), 2) for r in alignment.test_rate[::step]
        ]
        base_rate_sub = [
            round(float(r), 2) for r in alignment.base_rate_aligned[::step]
        ]
        
        # 6. Aligned Word Annotations for Interactive Karaoke
        aligned_words = []
        if word_boundaries:
            # Map baseline word boundaries to test timeline via DTW warping mapping
            for wb in word_boundaries:
                # Find matching test times
                b_start = wb["start_sec"]
                b_end = wb["end_sec"]
                
                # Check if this word falls within any detected flaw interval
                has_flaw = False
                flaw_tag = None
                for f in flaws:
                    if max(b_start, f.start_sec) <= min(b_end, f.end_sec):
                        has_flaw = True
                        flaw_tag = f.flaw_type
                        break
                        
                aligned_words.append({
                    "word": wb["word"],
                    "start_sec": b_start,
                    "end_sec": b_end,
                    "has_flaw": has_flaw,
                    "flaw_type": flaw_tag
                })
        elif transcript:
            # Fallback uniform word distribution
            words = transcript.split()
            dur = test_feat.duration_sec
            w_step = dur / max(1, len(words))
            for i, w in enumerate(words):
                w_start = round(i * w_step, 2)
                w_end = round(min(dur, (i + 1) * w_step), 2)
                has_flaw = any(max(w_start, f.start_sec) <= min(w_end, f.end_sec) for f in flaws)
                aligned_words.append({
                    "word": w,
                    "start_sec": w_start,
                    "end_sec": w_end,
                    "has_flaw": has_flaw,
                    "flaw_type": "DELIVERY_FLAW" if has_flaw else None
                })
                
        # Convert flaws to dictionaries
        flaws_dict = []
        for f in flaws:
            flaws_dict.append({
                "flaw_type": f.flaw_type,
                "severity": f.severity,
                "start_sec": f.start_sec,
                "end_sec": f.end_sec,
                "start_ms": f.start_ms,
                "end_ms": f.end_ms,
                "duration_sec": f.duration_sec,
                "affected_phrase": f.affected_phrase,
                "metric_name": f.metric_name,
                "metric_delta": f.metric_delta,
                "mathematical_proof": f.mathematical_proof,
                "causal_explanation": f.causal_explanation,
                "coaching_recommendation": f.coaching_recommendation
            })
            
        return {
            "scorecard": asdict(scorecard),
            "flaws": flaws_dict,
            "flaw_count": len(flaws_dict),
            "words": aligned_words,
            "summary": {
                "duration_test_sec": round(test_feat.duration_sec, 2),
                "duration_base_sec": round(base_feat.duration_sec, 2),
                "test_mean_wpm": round(test_feat.mean_wpm, 1),
                "base_mean_wpm": round(base_feat.mean_wpm, 1),
                "test_pitch_std_st": round(test_feat.f0_std_semitones, 2),
                "base_pitch_std_st": round(base_feat.f0_std_semitones, 2),
                "test_dynamic_range_db": round(test_feat.dynamic_range_db, 1),
                "base_dynamic_range_db": round(base_feat.dynamic_range_db, 1),
                "dtw_alignment_cost": round(alignment.dtw_distance, 3)
            },
            "forensics": {
                "test": asdict(test_feat.forensic_voice),
                "base": asdict(base_feat.forensic_voice)
            },
            "visualization": {
                "timestamps": times_sub,
                "test_pitch_semitones": test_pitch_sub,
                "base_pitch_semitones": base_pitch_sub,
                "test_energy": test_energy_sub,
                "base_energy": base_energy_sub,
                "test_rate": test_rate_sub,
                "base_rate": base_rate_sub
            }
        }
