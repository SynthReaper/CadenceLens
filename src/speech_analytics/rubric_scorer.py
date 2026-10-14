"""
rubric_scorer.py: Evaluative rubric-based oratorical scoring engine.
Produces reproducible 0-100 scores across 4 key delivery dimensions,
plus a Composite Delivery Index (CDI) and performance letter grade.
"""

from dataclasses import dataclass
import numpy as np
from src.speech_analytics.feature_extractor import AcousticFeatures
from src.speech_analytics.aligner import AlignmentResult
from src.speech_analytics.flaw_detector import GroundedFlaw


@dataclass
class RubricScorecard:
    pacing_score: float             # 0 - 100: Cadence, speech rate stability, lack of rush/drag
    pitch_dynamism_score: float     # 0 - 100: Melodic expressiveness, F0 range, absence of monotone
    stress_emphasis_score: float    # 0 - 100: Energy hierarchy alignment, acoustic emphasis
    fluency_pause_score: float      # 0 - 100: Pause discipline, lack of awkward disfluencies
    composite_delivery_index: float # 0 - 100: Weighted total score
    letter_grade: str               # A+, A, B, C, D, F
    summary_verdict: str            # Concise executive critique
    detected_flaw_count: int
    flaw_penalty_breakdown: dict


class RubricScorer:
    """Calculates objective, rubric-based competitive speech evaluation scores."""
    
    # Pillar weights for Composite Delivery Index
    WEIGHT_PACING = 0.25
    WEIGHT_PITCH = 0.30
    WEIGHT_STRESS = 0.20
    WEIGHT_FLUENCY = 0.25
    
    @classmethod
    def calculate_scores(cls, base_features: AcousticFeatures, 
                         test_features: AcousticFeatures, 
                         alignment: AlignmentResult, 
                         flaws: list[GroundedFlaw]) -> RubricScorecard:
        """Computes multi-dimensional rubric scorecard."""
        
        # 1. Pacing & Cadence Score (Base 100)
        # Ratio of WPM to baseline WPM
        wpm_ratio = test_features.mean_wpm / max(1.0, base_features.mean_wpm)
        # Optimal ratio is near 1.0; penalize divergence
        rate_diff = abs(1.0 - wpm_ratio)
        pacing_base = max(30.0, 100.0 - (rate_diff * 60.0))

        # Duration coverage check: if recording is truncated (< 65% of baseline), penalize pacing severely
        dur_ratio = test_features.duration_sec / max(0.1, base_features.duration_sec)
        if dur_ratio < 0.65:
            trunc_factor = max(0.08, dur_ratio / 0.65)
            pacing_base = max(5.0, pacing_base * trunc_factor)
        
        # Penalize for rush and drag flaw intervals
        pacing_penalties = 0.0
        for f in flaws:
            if f.flaw_type == "ERRATIC_RUSH":
                mult = 1.4 if f.severity == "HIGH" else 1.0
                pacing_penalties += f.duration_sec * 8.0 * mult
            elif f.flaw_type == "SLUGGISH_DRAG":
                pacing_penalties += f.duration_sec * 6.0
            elif f.flaw_type == "CRITICAL_DURATION_TRUNCATION":
                pacing_penalties += 45.0
        pacing_score = max(5.0, min(100.0, pacing_base - pacing_penalties))
        
        # 2. Pitch Dynamism & Melodic Score (Base 100)
        # Pitch variance ratio
        var_ratio = test_features.f0_std_semitones / max(0.5, base_features.f0_std_semitones)
        pitch_base = max(30.0, min(100.0, 85.0 + (min(1.2, var_ratio) - 1.0) * 40.0))
        
        # Penalize for monotone regions
        pitch_penalties = 0.0
        for f in flaws:
            if f.flaw_type == "MONOTONE_CADENCE":
                mult = 1.6 if f.severity == "CRITICAL" else 1.2 if f.severity == "HIGH" else 0.8
                pitch_penalties += f.duration_sec * 12.0 * mult
        pitch_score = max(10.0, min(100.0, pitch_base - pitch_penalties))
        
        # 3. Stress & Emphasis Score (Base 100)
        # Energy contour correlation
        valid_idx = (~np.isnan(alignment.base_energy_aligned)) & (~np.isnan(alignment.test_energy))
        if np.sum(valid_idx) > 10:
            e_base = alignment.base_energy_aligned[valid_idx]
            e_test = alignment.test_energy[valid_idx]
            corr = np.corrcoef(e_base, e_test)[0, 1]
            corr = 0.0 if np.isnan(corr) else corr
            stress_base = max(30.0, 60.0 + corr * 40.0)
        else:
            stress_base = 75.0
            
        stress_penalties = 0.0
        for f in flaws:
            if f.flaw_type == "MISPLACED_EMPHASIS":
                stress_penalties += f.duration_sec * 10.0
        stress_score = max(10.0, min(100.0, stress_base - stress_penalties))
        
        # 4. Fluency & Pause Discipline Score (Base 100)
        # Pause ratio comparison
        pause_ratio_diff = max(0.0, test_features.pause_speech_ratio - base_features.pause_speech_ratio)
        fluency_base = max(40.0, 100.0 - pause_ratio_diff * 80.0)

        if dur_ratio < 0.65:
            fluency_base = max(5.0, fluency_base * max(0.1, dur_ratio / 0.65))
        
        fluency_penalties = 0.0
        for f in flaws:
            if f.flaw_type == "INAPPROPRIATE_PAUSE":
                mult = 1.5 if f.severity == "CRITICAL" else 1.1 if f.severity == "HIGH" else 0.7
                fluency_penalties += f.duration_sec * 14.0 * mult
            elif f.flaw_type == "CRITICAL_DURATION_TRUNCATION":
                fluency_penalties += 35.0
        fluency_score = max(5.0, min(100.0, fluency_base - fluency_penalties))
        
        # 5. Composite Delivery Index (CDI)
        cdi = (
            cls.WEIGHT_PACING * pacing_score +
            cls.WEIGHT_PITCH * pitch_score +
            cls.WEIGHT_STRESS * stress_score +
            cls.WEIGHT_FLUENCY * fluency_score
        )
        cdi = round(float(cdi), 1)
        
        # Letter Grade
        if cdi >= 93.0:
            grade = "A+"
            verdict = "Exemplary Oratorical Mastery: Compelling cadence, brilliant melodic variance, and impeccable pause discipline."
        elif cdi >= 85.0:
            grade = "A"
            verdict = "Strong Rhetorical Delivery: Well-controlled pacing with minor localized delivery deviations."
        elif cdi >= 75.0:
            grade = "B"
            verdict = "Competent Delivery: Solid baseline comprehension, but noticeable moments of monotone or tempo fluctuation."
        elif cdi >= 60.0:
            grade = "C"
            verdict = "Moderate Delivery Deficits: Repeated flaws in phrasing, unnatural pauses, or suppressed emotional inflection."
        elif cdi >= 45.0:
            grade = "D"
            verdict = "Significant Oratorical Deficiencies: Pronounced monotone cadence, erratic tempo rushes, and disjointed delivery."
        else:
            grade = "F"
            verdict = "Severe Delivery Breakdown: Flatline prosody, disfluent syntactic pauses, and unanchored vocal control."
            
        return RubricScorecard(
            pacing_score=round(float(pacing_score), 1),
            pitch_dynamism_score=round(float(pitch_score), 1),
            stress_emphasis_score=round(float(stress_score), 1),
            fluency_pause_score=round(float(fluency_score), 1),
            composite_delivery_index=cdi,
            letter_grade=grade,
            summary_verdict=verdict,
            detected_flaw_count=len(flaws),
            flaw_penalty_breakdown={
                "pacing_penalties": round(float(pacing_penalties), 1),
                "pitch_penalties": round(float(pitch_penalties), 1),
                "stress_penalties": round(float(stress_penalties), 1),
                "fluency_penalties": round(float(fluency_penalties), 1)
            }
        )
