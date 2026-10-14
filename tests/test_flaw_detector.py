"""
Unit tests for TemporalFlawDetector and RubricScorer.
"""
import pytest
import numpy as np
from src.speech_analytics.feature_extractor import AcousticFeatureExtractor
from src.speech_analytics.aligner import SequenceAligner
from src.speech_analytics.flaw_detector import TemporalFlawDetector, GroundedFlaw
from src.speech_analytics.rubric_scorer import RubricScorer, RubricScorecard


def test_rubric_scorer_perfect_match():
    import soundfile as sf
    base_path = "dataset/speeches/jfk_inaugural/baseline.wav"
    audio, sr = sf.read(base_path)
    
    extractor = AcousticFeatureExtractor(sample_rate=sr)
    feat1 = extractor.process(audio)
    feat2 = extractor.process(audio) # identical match
    
    aligner = SequenceAligner()
    alignment = aligner.align(feat1, feat2)
    
    detector = TemporalFlawDetector()
    flaws = detector.analyze(alignment, feat1, feat2)
    
    scorecard = RubricScorer.calculate_scores(feat1, feat2, alignment, flaws)
    
    assert isinstance(scorecard, RubricScorecard)
    assert scorecard.composite_delivery_index >= 85.0
    assert scorecard.letter_grade in ["A+", "A"]
    assert len(flaws) == 0


def test_flaw_penalty_accumulation():
    sr = 22050
    t = np.linspace(0, 3.0, int(sr * 3.0), endpoint=False)
    audio = 0.5 * np.sin(2 * np.pi * 180.0 * t)
    
    extractor = AcousticFeatureExtractor(sample_rate=sr)
    feat = extractor.process(audio)
    aligner = SequenceAligner()
    alignment = aligner.align(feat, feat)
    
    # Artificially inject severe flaws
    mock_flaws = [
        GroundedFlaw(
            flaw_type="INAPPROPRIATE_PAUSE",
            severity="CRITICAL",
            start_sec=1.0,
            end_sec=3.0,
            start_ms=1000,
            end_ms=3000,
            duration_sec=2.0,
            affected_phrase="[pause]",
            metric_name="pause",
            metric_delta={},
            mathematical_proof="proof",
            causal_explanation="causal",
            coaching_recommendation="coach"
        ),
        GroundedFlaw(
            flaw_type="MONOTONE_CADENCE",
            severity="HIGH",
            start_sec=0.5,
            end_sec=2.5,
            start_ms=500,
            end_ms=2500,
            duration_sec=2.0,
            affected_phrase="[monotone]",
            metric_name="monotone",
            metric_delta={},
            mathematical_proof="proof",
            causal_explanation="causal",
            coaching_recommendation="coach"
        )
    ]
    
    scorecard = RubricScorer.calculate_scores(feat, feat, alignment, mock_flaws)
    # The score should drop significantly due to penalties
    assert scorecard.composite_delivery_index < 70.0
    assert scorecard.detected_flaw_count == 2
