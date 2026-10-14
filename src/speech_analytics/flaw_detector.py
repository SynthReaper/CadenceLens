"""
flaw_detector.py: Temporal grounding and causal flaw extraction engine.
Detects acoustic delivery flaws, bounds their exact temporal intervals [t_start, t_end],
and computes mathematically grounded causal rationales and coaching recommendations.
"""

from dataclasses import dataclass, field
import numpy as np
import scipy.ndimage
from src.speech_analytics.feature_extractor import AcousticFeatures
from src.speech_analytics.aligner import AlignmentResult


@dataclass
class GroundedFlaw:
    flaw_type: str                  # MONOTONE_CADENCE, ERRATIC_RUSH, SLUGGISH_DRAG, INAPPROPRIATE_PAUSE, MISPLACED_EMPHASIS
    severity: str                   # LOW, MODERATE, HIGH, CRITICAL
    start_sec: float                # Bounded start time in seconds
    end_sec: float                  # Bounded end time in seconds
    start_ms: int
    end_ms: int
    duration_sec: float
    affected_phrase: str            # Aligned transcript phrase or token
    metric_name: str                # e.g., 'f0_variance_collapse', 'tempo_surge_ratio'
    metric_delta: dict              # Exact quantitative measurements
    mathematical_proof: str         # Formal mathematical delta statement
    causal_explanation: str         # Deep causal diagnosis for why the delivery fails
    coaching_recommendation: str    # Actionable prescription for oratorical improvement


class TemporalFlawDetector:
    """Isolates temporal regions of rhetorical deviation and constructs causal explanations."""
    
    def __init__(self, frame_hop_sec: float = 512 / 22050):
        self.frame_hop_sec = frame_hop_sec
        
    def _cluster_intervals(self, mask: np.ndarray, times: np.ndarray, 
                           min_duration_sec: float = 0.25, bridge_gap_sec: float = 0.20) -> list[tuple[float, float]]:
        """Hysteresis temporal clustering: bridges micro-gaps and filters spurious blips."""
        if not np.any(mask):
            return []
            
        bridge_frames = int(bridge_gap_sec / self.frame_hop_sec)
        if bridge_frames > 0:
            # Morphological binary closing
            struct = np.ones(bridge_frames)
            mask_closed = scipy.ndimage.binary_closing(mask, structure=struct)
        else:
            mask_closed = mask
            
        labeled, num_features = scipy.ndimage.label(mask_closed)
        intervals = []
        
        for feat_id in range(1, num_features + 1):
            indices = np.where(labeled == feat_id)[0]
            if len(indices) == 0:
                continue
            t_start = float(times[indices[0]])
            t_end = float(times[indices[-1]])
            dur = t_end - t_start
            if dur >= min_duration_sec:
                intervals.append((round(t_start, 2), round(t_end, 2)))
                
        return intervals

    def detect_monotone_regions(self, alignment: AlignmentResult, 
                                base_features: AcousticFeatures, 
                                test_features: AcousticFeatures) -> list[GroundedFlaw]:
        """Detects segments where pitch variation collapses into a flat, robotic monotone."""
        flaws = []
        test_pitch = alignment.test_pitch
        base_pitch = alignment.base_pitch_aligned
        times = alignment.test_times
        voiced = test_features.voiced_mask
        
        # Calculate local rolling standard deviation of pitch (1.0s window)
        win_size = int(1.0 / self.frame_hop_sec)
        if len(test_pitch) < win_size:
            return flaws
            
        test_std = np.zeros_like(test_pitch)
        base_std = np.zeros_like(base_pitch)
        
        for i in range(len(test_pitch)):
            idx_start = max(0, i - win_size // 2)
            idx_end = min(len(test_pitch), i + win_size // 2)
            
            v_test = test_pitch[idx_start:idx_end]
            v_test = v_test[~np.isnan(v_test)]
            test_std[i] = np.std(v_test) if len(v_test) > 5 else 0.0
            
            v_base = base_pitch[idx_start:idx_end]
            v_base = v_base[~np.isnan(v_base)]
            base_std[i] = np.std(v_base) if len(v_base) > 5 else 0.0
            
        # Monotone condition: baseline was modulated (base_std > 2.0 semitones) but test is flat (test_std < 1.1 semitones)
        monotone_mask = (base_std >= 1.8) & (test_std <= 1.05) & voiced
        intervals = self._cluster_intervals(monotone_mask, times, min_duration_sec=0.40)
        
        for t_start, t_end in intervals:
            idx = np.where((times >= t_start) & (times <= t_end))[0]
            meas_base_std = float(np.mean(base_std[idx]))
            meas_test_std = float(np.mean(test_std[idx]))
            reduction_pct = round((1.0 - (meas_test_std / max(1e-4, meas_base_std))) * 100, 1)
            
            dur = round(t_end - t_start, 2)
            severity = "CRITICAL" if reduction_pct > 80 else "HIGH" if reduction_pct > 65 else "MODERATE"
            
            proof = f"sigma_F0(test) = {meas_test_std:.2f} ST vs sigma_F0(base) = {meas_base_std:.2f} ST (Delta = -{reduction_pct}%)"
            
            flaws.append(GroundedFlaw(
                flaw_type="MONOTONE_CADENCE",
                severity=severity,
                start_sec=t_start,
                end_sec=t_end,
                start_ms=int(t_start * 1000),
                end_ms=int(t_end * 1000),
                duration_sec=dur,
                affected_phrase="[Rhetorical Phrase]",
                metric_name="pitch_variance_collapse",
                metric_delta={
                    "test_pitch_std_st": round(meas_test_std, 2),
                    "base_pitch_std_st": round(meas_base_std, 2),
                    "variance_drop_percent": reduction_pct
                },
                mathematical_proof=proof,
                causal_explanation=(
                    f"Acoustic melodic flatline detected over {dur}s window. Pitch standard deviation collapsed to "
                    f"{meas_test_std:.2f} semitones (-{reduction_pct}% relative to baseline oration). In oratorical delivery, "
                    f"this suppression of fundamental frequency eliminates intonational contrast, signaling disinterest or robotic reading."
                ),
                coaching_recommendation=(
                    f"Introduce conscious melodic movement: elevate your pitch by +3 to +5 semitones on primary rhetorical "
                    f"keywords and conclude the clause with a decisive falling cadence."
                )
            ))
            
        return flaws

    def detect_pacing_deviations(self, alignment: AlignmentResult, 
                                 base_features: AcousticFeatures, 
                                 test_features: AcousticFeatures) -> list[GroundedFlaw]:
        """Detects localized speech velocity anomalies: rushed surges or sluggish dragging."""
        flaws = []
        test_rate = alignment.test_rate
        base_rate = alignment.base_rate_aligned
        times = alignment.test_times
        
        # Relative tempo ratio: test / base
        eps = 1e-4
        tempo_ratio = test_rate / (base_rate + eps)
        
        # 1. Rushed speech (rate > 1.30x baseline)
        rush_mask = tempo_ratio >= 1.28
        rush_intervals = self._cluster_intervals(rush_mask, times, min_duration_sec=0.35)
        
        for t_start, t_end in rush_intervals:
            idx = np.where((times >= t_start) & (times <= t_end))[0]
            avg_ratio = float(np.mean(tempo_ratio[idx]))
            dur = round(t_end - t_start, 2)
            surge_pct = round((avg_ratio - 1.0) * 100, 1)
            severity = "HIGH" if surge_pct >= 50 else "MODERATE"
            
            flaws.append(GroundedFlaw(
                flaw_type="ERRATIC_RUSH",
                severity=severity,
                start_sec=t_start,
                end_sec=t_end,
                start_ms=int(t_start * 1000),
                end_ms=int(t_end * 1000),
                duration_sec=dur,
                affected_phrase="[Accelerated Segment]",
                metric_name="tempo_surge_ratio",
                metric_delta={
                    "tempo_ratio": round(avg_ratio, 2),
                    "surge_percent": surge_pct,
                    "estimated_wpm": int(test_features.mean_wpm * avg_ratio)
                },
                mathematical_proof=f"v_speech(test) = {avg_ratio:.2f} * v_speech(base) (+{surge_pct}% tempo surge)",
                causal_explanation=(
                    f"Speech velocity surged by +{surge_pct}% across this {dur}s window. "
                    f"Syllable durations were compressed significantly below oratorical thresholds, "
                    f"compromising phonetic clarity and conveying an impression of anxiety or haste."
                ),
                coaching_recommendation=(
                    f"Deliberately decelerate by ~{int(surge_pct * 0.7)}%. Anchor your breath and articulate each vowel "
                    f"fully, allowing cognitive pauses for the listener to assimilate your point."
                )
            ))
            
        # 2. Sluggish dragging (rate <= 0.65x baseline)
        drag_mask = (tempo_ratio <= 0.68) & (test_features.rms_db > -25.0)
        drag_intervals = self._cluster_intervals(drag_mask, times, min_duration_sec=0.45)
        
        for t_start, t_end in drag_intervals:
            idx = np.where((times >= t_start) & (times <= t_end))[0]
            avg_ratio = float(np.mean(tempo_ratio[idx]))
            dur = round(t_end - t_start, 2)
            drop_pct = round((1.0 - avg_ratio) * 100, 1)
            
            flaws.append(GroundedFlaw(
                flaw_type="SLUGGISH_DRAG",
                severity="MODERATE",
                start_sec=t_start,
                end_sec=t_end,
                start_ms=int(t_start * 1000),
                end_ms=int(t_end * 1000),
                duration_sec=dur,
                affected_phrase="[Decelerated Segment]",
                metric_name="tempo_drag_ratio",
                metric_delta={
                    "tempo_ratio": round(avg_ratio, 2),
                    "drop_percent": drop_pct
                },
                mathematical_proof=f"v_speech(test) = {avg_ratio:.2f} * v_speech(base) (-{drop_pct}% tempo drop)",
                causal_explanation=(
                    f"Speech tempo dropped by -{drop_pct}%, resulting in an unnatural sluggish cadence over {dur}s. "
                    f"Excessive prolongation of syllables weakens rhetorical momentum."
                ),
                coaching_recommendation="Maintain forward energy; avoid dragging non-essential transitional syllables."
            ))
            
        return flaws

    def detect_inappropriate_pauses(self, test_features: AcousticFeatures, 
                                    base_features: AcousticFeatures, 
                                    alignment: AlignmentResult) -> list[GroundedFlaw]:
        """Detects disfluency dead air or pauses placed awkwardly inside syntactic clauses."""
        flaws = []
        base_pauses = base_features.pauses
        test_pauses = test_features.pauses
        
        for tp in test_pauses:
            t_start = tp["start_sec"]
            t_end = tp["end_sec"]
            dur = tp["duration_sec"]
            
            # Map test pause center to aligned baseline time
            center_test_idx = int(((t_start + t_end) / 2) / self.frame_hop_sec)
            center_test_idx = min(len(alignment.base_times_aligned) - 1, max(0, center_test_idx))
            mapped_base_time = alignment.base_times_aligned[center_test_idx]
            
            # Check if baseline had a pause nearby (+- 0.5s)
            matched_base_pause = None
            for bp in base_pauses:
                if abs(bp["start_sec"] - mapped_base_time) <= 0.65 or (bp["start_sec"] <= mapped_base_time <= bp["end_sec"]):
                    matched_base_pause = bp
                    break
                    
            if matched_base_pause is None:
                # Disfluency pause: baseline had continuous speech, test inserted dead air
                if dur >= 0.75:
                    severity = "CRITICAL" if dur >= 1.8 else "HIGH" if dur >= 1.2 else "MODERATE"
                    flaws.append(GroundedFlaw(
                        flaw_type="INAPPROPRIATE_PAUSE",
                        severity=severity,
                        start_sec=t_start,
                        end_sec=t_end,
                        start_ms=tp["start_ms"],
                        end_ms=tp["end_ms"],
                        duration_sec=dur,
                        affected_phrase="[Disfluent Silence]",
                        metric_name="unplanned_silence_duration",
                        metric_delta={
                            "pause_duration_ms": int(dur * 1000),
                            "baseline_activity": "continuous_speech"
                        },
                        mathematical_proof=f"tau_pause(test) = {dur:.2f}s, baseline = continuous acoustic voicing",
                        causal_explanation=(
                            f"An unscheduled silence of {dur:.2f}s occurred mid-utterance. "
                            f"The baseline oration executes a continuous acoustic arc at this point; "
                            f"this pause ruptures syntactic cohesion and suggests hesitation or memory lapse."
                        ),
                        coaching_recommendation=(
                            "Eliminate dead air inside the phrase. Connect words with sustained vocal support; "
                            "reserve pauses exclusively for major punctuation and rhetorical punctuation."
                        )
                    ))
            else:
                # Both paused, but test was excessively prolonged
                base_dur = matched_base_pause["duration_sec"]
                if dur > base_dur + 1.2:
                    flaws.append(GroundedFlaw(
                        flaw_type="INAPPROPRIATE_PAUSE",
                        severity="MODERATE",
                        start_sec=t_start,
                        end_sec=t_end,
                        start_ms=tp["start_ms"],
                        end_ms=tp["end_ms"],
                        duration_sec=dur,
                        affected_phrase="[Over-extended Pause]",
                        metric_name="excessive_pause_duration",
                        metric_delta={
                            "test_duration_ms": int(dur * 1000),
                            "base_duration_ms": int(base_dur * 1000),
                            "excess_ms": int((dur - base_dur) * 1000)
                        },
                        mathematical_proof=f"tau_pause(test) = {dur:.2f}s vs tau_pause(base) = {base_dur:.2f}s (+{dur - base_dur:.2f}s excess)",
                        causal_explanation=(
                            f"Pause duration ({dur:.2f}s) exceeded baseline rhetorical pause ({base_dur:.2f}s) by "
                            f"+{dur - base_dur:.2f}s, causing awkward dead air."
                        ),
                        coaching_recommendation="Keep rhetorical punctuation pauses between 0.3s and 0.8s."
                    ))
                    
        return flaws

    def detect_stress_deviations(self, alignment: AlignmentResult, 
                                 base_features: AcousticFeatures, 
                                 test_features: AcousticFeatures) -> list[GroundedFlaw]:
        """Detects misplaced emphasis where unstressed words are blasted or key words muted."""
        flaws = []
        test_energy = alignment.test_energy
        base_energy = alignment.base_energy_aligned
        times = alignment.test_times
        voiced = test_features.voiced_mask
        
        # Energy inversion delta
        energy_delta = test_energy - base_energy
        
        # Blast on minor words: test is loud (energy > 0.85) while base was low (< 0.35)
        blast_mask = (test_energy >= 0.82) & (base_energy <= 0.38) & voiced
        intervals = self._cluster_intervals(blast_mask, times, min_duration_sec=0.20)
        
        for t_start, t_end in intervals:
            idx = np.where((times >= t_start) & (times <= t_end))[0]
            meas_delta = float(np.mean(energy_delta[idx]))
            dur = round(t_end - t_start, 2)
            
            flaws.append(GroundedFlaw(
                flaw_type="MISPLACED_EMPHASIS",
                severity="MODERATE",
                start_sec=t_start,
                end_sec=t_end,
                start_ms=int(t_start * 1000),
                end_ms=int(t_end * 1000),
                duration_sec=dur,
                affected_phrase="[Misplaced Stress]",
                metric_name="energy_inversion_delta",
                metric_delta={
                    "energy_delta": round(meas_delta, 2),
                    "test_energy": round(float(np.mean(test_energy[idx])), 2),
                    "base_energy": round(float(np.mean(base_energy[idx])), 2)
                },
                mathematical_proof=f"Delta_E = +{meas_delta:.2f} (E_test = {np.mean(test_energy[idx]):.2f} vs E_base = {np.mean(base_energy[idx]):.2f})",
                causal_explanation=(
                    f"Acoustic prominence inverted over {dur}s. Unstressed structural syllables received an explosive "
                    f"energy boost while the primary semantic core was acoustically eclipsed."
                ),
                coaching_recommendation="Subdue vocal intensity on grammatical prepositions; reserve maximum dynamic volume for conceptual focal points."
            ))
            
        return flaws

    def analyze(self, alignment: AlignmentResult, 
                base_features: AcousticFeatures, 
                test_features: AcousticFeatures,
                transcript: str = "") -> list[GroundedFlaw]:
        """Runs the complete causal flaw extraction and temporal grounding suite."""
        all_flaws = []
        all_flaws.extend(self.detect_monotone_regions(alignment, base_features, test_features))
        all_flaws.extend(self.detect_pacing_deviations(alignment, base_features, test_features))
        all_flaws.extend(self.detect_inappropriate_pauses(test_features, base_features, alignment))
        all_flaws.extend(self.detect_stress_deviations(alignment, base_features, test_features))

        # Check for severe content / duration truncation (< 65% of baseline)
        if test_features.duration_sec < base_features.duration_sec * 0.65:
            dur_deficit = base_features.duration_sec - test_features.duration_sec
            pct_cov = (test_features.duration_sec / max(0.1, base_features.duration_sec)) * 100.0
            all_flaws.insert(0, GroundedFlaw(
                flaw_type="CRITICAL_DURATION_TRUNCATION",
                severity="CRITICAL",
                start_sec=0.0,
                end_sec=round(test_features.duration_sec, 2),
                start_ms=0,
                end_ms=int(test_features.duration_sec * 1000),
                duration_sec=round(test_features.duration_sec, 2),
                affected_phrase="[Complete Utterance - Truncated]",
                metric_name="duration_coverage_deficit",
                metric_delta={
                    "test_duration_s": round(test_features.duration_sec, 2),
                    "base_duration_s": round(base_features.duration_sec, 2),
                    "coverage_percent": round(pct_cov, 1),
                    "shortfall_s": round(dur_deficit, 2)
                },
                mathematical_proof=f"T_test = {test_features.duration_sec:.2f}s vs T_base = {base_features.duration_sec:.2f}s (Coverage: {pct_cov:.1f}%, Shortfall: -{dur_deficit:.2f}s)",
                causal_explanation=(
                    f"Recording length ({test_features.duration_sec:.2f}s) covers only {pct_cov:.1f}% of the target reference oration "
                    f"({base_features.duration_sec:.2f}s). Abrupt cessation or speaking brief isolated words ruptures rhetorical cohesion "
                    f"and fails to sustain grammatical cadence."
                ),
                coaching_recommendation="Recite the full passage completely from beginning to end at a steady declamation pace of 125-138 WPM."
            ))
        
        # Sort chronologically
        all_flaws.sort(key=lambda f: f.start_sec)
        
        # Attach aligned word transcript snippets if transcript provided
        if transcript:
            words = transcript.split()
            n_words = len(words)
            dur = max(0.1, test_features.duration_sec)
            for flaw in all_flaws:
                # Estimate word index span from time fraction
                w_start = int((flaw.start_sec / dur) * n_words)
                w_end = min(n_words, int(np.ceil((flaw.end_sec / dur) * n_words)) + 1)
                w_start = max(0, min(n_words - 1, w_start))
                w_end = max(w_start + 1, min(n_words, w_end))
                flaw.affected_phrase = " ".join(words[w_start:w_end])
                
        return all_flaws
