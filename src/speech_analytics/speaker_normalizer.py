"""
speaker_normalizer.py: Speaker-agnostic acoustic normalization.
Eliminates biological vocal fold bias (fundamental frequency register) and
recording gain variance to enable fair, invariant rhetorical comparison.
"""

import numpy as np
from src.speech_analytics.feature_extractor import AcousticFeatures


class SpeakerNormalizer:
    """Normalizes acoustic features to invariant speaker-agnostic representations."""
    
    @staticmethod
    def normalize_pitch_semitones(features: AcousticFeatures) -> np.ndarray:
        """
        Maps pitch into semitones centered on the speaker's median voiced pitch.
        Yields identical relative scale whether speaker is male (110 Hz) or female (220 Hz).
        """
        voiced = features.voiced_mask
        norm_f0 = np.full_like(features.f0_hz, np.nan)
        
        if np.sum(voiced) < 5:
            return norm_f0
            
        median_f0 = np.median(features.f0_hz[voiced])
        norm_f0[voiced] = 12.0 * np.log2(features.f0_hz[voiced] / (median_f0 + 1e-6))
        return norm_f0

    @staticmethod
    def zscore_pitch(features: AcousticFeatures) -> np.ndarray:
        """Calculates Z-score of voiced pitch semitones (mean=0, variance=1)."""
        st = SpeakerNormalizer.normalize_pitch_semitones(features)
        voiced = features.voiced_mask
        z_pitch = np.full_like(st, np.nan)
        
        if np.sum(voiced) < 5:
            return z_pitch
            
        mean_st = np.mean(st[voiced])
        std_st = max(1e-4, np.std(st[voiced]))
        z_pitch[voiced] = (st[voiced] - mean_st) / std_st
        return z_pitch

    @staticmethod
    def normalize_energy_percentile(features: AcousticFeatures) -> np.ndarray:
        """
        P10-P90 percentile dynamic range normalization.
        Invariance against microphone gain, recording distance, and room acoustics.
        """
        energy = features.rms_energy
        if len(energy) == 0:
            return energy
            
        p10 = np.percentile(energy, 10)
        p90 = np.percentile(energy, 90)
        
        denom = max(1e-6, p90 - p10)
        norm_energy = np.clip((energy - p10) / denom, 0.0, 1.5)
        return norm_energy

    @staticmethod
    def normalize_speech_rate(features: AcousticFeatures) -> np.ndarray:
        """Relative tempo curve normalized by speaker's global mean rate."""
        rate = features.speech_rate_curve
        mean_rate = max(1e-4, np.mean(rate))
        return rate / mean_rate

    @classmethod
    def get_normalized_feature_bundle(cls, features: AcousticFeatures) -> dict:
        """Returns unified dictionary of speaker-agnostic time-series curves."""
        return {
            "time_stamps": features.time_stamps,
            "pitch_semitones": cls.normalize_pitch_semitones(features),
            "pitch_zscore": cls.zscore_pitch(features),
            "energy_normalized": cls.normalize_energy_percentile(features),
            "relative_rate": cls.normalize_speech_rate(features),
            "voiced_mask": features.voiced_mask,
            "pauses": features.pauses
        }
