"""
Unit tests for AcousticFeatureExtractor.
"""
import pytest
import numpy as np
from src.speech_analytics.feature_extractor import AcousticFeatureExtractor, AcousticFeatures


def test_feature_extractor_synthetic_sine():
    sr = 22050
    duration = 2.0
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    # 220 Hz sine wave
    audio = 0.5 * np.sin(2 * np.pi * 220.0 * t)
    
    extractor = AcousticFeatureExtractor(sample_rate=sr)
    feat = extractor.process(audio)
    
    assert isinstance(feat, AcousticFeatures)
    assert feat.sample_rate == sr
    assert abs(feat.duration_sec - duration) < 0.05
    assert len(feat.time_stamps) > 0
    # Mean F0 should be close to 220 Hz
    assert abs(feat.mean_f0 - 220.0) < 5.0
    assert feat.dynamic_range_db >= 0.0


def test_pause_detection():
    sr = 22050
    # 1s sound + 1s silence + 1s sound
    t_tone = np.linspace(0, 1.0, sr, endpoint=False)
    tone = 0.5 * np.sin(2 * np.pi * 440.0 * t_tone)
    silence = np.zeros(sr)
    audio = np.concatenate([tone, silence, tone])
    
    extractor = AcousticFeatureExtractor(sample_rate=sr)
    feat = extractor.process(audio)
    
    assert len(feat.pauses) >= 1
    # Check that a pause is centered around 1.0s to 2.0s
    p = feat.pauses[0]
    assert p["start_sec"] >= 0.8
    assert p["end_sec"] <= 2.2
    assert p["duration_sec"] >= 0.5
