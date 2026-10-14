"""
Unit tests for SequenceAligner and SpeakerNormalizer.
"""
import pytest
import numpy as np
from src.speech_analytics.feature_extractor import AcousticFeatureExtractor
from src.speech_analytics.speaker_normalizer import SpeakerNormalizer
from src.speech_analytics.aligner import SequenceAligner


def test_speaker_normalizer_invariance():
    sr = 22050
    t = np.linspace(0, 1.5, int(sr * 1.5), endpoint=False)
    
    # Low male voice (120 Hz) vs High female voice (240 Hz)
    male_audio = 0.5 * np.sin(2 * np.pi * 120.0 * t)
    female_audio = 0.5 * np.sin(2 * np.pi * 240.0 * t)
    
    extractor = AcousticFeatureExtractor(sample_rate=sr)
    m_feat = extractor.process(male_audio)
    f_feat = extractor.process(female_audio)
    
    m_norm = SpeakerNormalizer.normalize_pitch_semitones(m_feat)
    f_norm = SpeakerNormalizer.normalize_pitch_semitones(f_feat)
    
    # Both constant-pitch tones should have semitone pitch close to 0 relative to their median
    m_val = np.nanmean(m_norm)
    f_val = np.nanmean(f_norm)
    assert abs(m_val) < 0.1
    assert abs(f_val) < 0.1


def test_sequence_aligner():
    sr = 22050
    t = np.linspace(0, 2.0, int(sr * 2.0), endpoint=False)
    audio1 = 0.5 * np.sin(2 * np.pi * 300.0 * t)
    audio2 = 0.5 * np.sin(2 * np.pi * 300.0 * t[:int(sr * 1.8)]) # slightly shorter
    
    extractor = AcousticFeatureExtractor(sample_rate=sr)
    feat1 = extractor.process(audio1)
    feat2 = extractor.process(audio2)
    
    aligner = SequenceAligner()
    alignment = aligner.align(feat1, feat2)
    
    assert alignment.dtw_distance >= 0.0
    assert len(alignment.warping_path) > 0
    assert len(alignment.test_times) == len(feat2.time_stamps)
    assert len(alignment.base_pitch_aligned) == len(feat2.time_stamps)
