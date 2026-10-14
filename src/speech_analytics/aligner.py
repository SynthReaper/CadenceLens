"""
aligner.py: Dynamic Time Warping (DTW) and non-linear temporal sequence alignment.
Aligns baseline and participant utterances along a common rhetorical timeline.
"""

from dataclasses import dataclass
import numpy as np
import librosa
from sklearn.preprocessing import StandardScaler
from src.speech_analytics.feature_extractor import AcousticFeatures
from src.speech_analytics.speaker_normalizer import SpeakerNormalizer


@dataclass
class AlignmentResult:
    warping_path: np.ndarray          # Array of shape (N, 2) with [base_idx, test_idx]
    dtw_distance: float               # Cumulative normalized alignment cost
    test_times: np.ndarray            # Time coordinates of test frames
    base_times_aligned: np.ndarray    # Aligned time coordinates of baseline
    
    # Aligned feature curves (projected onto test timeline)
    base_pitch_aligned: np.ndarray
    test_pitch: np.ndarray
    base_energy_aligned: np.ndarray
    test_energy: np.ndarray
    base_rate_aligned: np.ndarray
    test_rate: np.ndarray


class SequenceAligner:
    """Performs acoustic-based non-linear temporal alignment between paired speeches."""
    
    def __init__(self, n_mfcc: int = 13):
        self.n_mfcc = n_mfcc
        
    def align(self, base_features: AcousticFeatures, test_features: AcousticFeatures) -> AlignmentResult:
        """
        Aligns test_features to base_features using cosine-metric DTW on normalized MFCCs.
        """
        # Multi-feature representations for DTW
        base_mfcc = base_features.mfcc
        test_mfcc = test_features.mfcc
        
        # Standardize MFCCs
        scaler_base = StandardScaler()
        base_mfcc_norm = scaler_base.fit_transform(base_mfcc.T).T
        
        scaler_test = StandardScaler()
        test_mfcc_norm = scaler_test.fit_transform(test_mfcc.T).T
        
        # Compute DTW using cosine metric
        D, wp = librosa.sequence.dtw(X=base_mfcc_norm, Y=test_mfcc_norm, metric='cosine')
        
        # wp is ordered from (last, last) down to (0, 0) -> reverse to chronological order
        wp_chrono = wp[::-1]
        dtw_cost = float(D[-1, -1] / len(wp_chrono))
        
        # Build mapping from test_idx to base_idx
        n_test = len(test_features.time_stamps)
        n_base = len(base_features.time_stamps)
        
        # For each test frame, average the aligned base frames
        test_to_base_map = {}
        for b_idx, t_idx in wp_chrono:
            if t_idx not in test_to_base_map:
                test_to_base_map[t_idx] = []
            test_to_base_map[t_idx].append(b_idx)
            
        aligned_base_idx = np.zeros(n_test, dtype=int)
        for t_idx in range(n_test):
            if t_idx in test_to_base_map:
                aligned_base_idx[t_idx] = int(round(np.mean(test_to_base_map[t_idx])))
            else:
                # Nearest interpolation
                aligned_base_idx[t_idx] = min(n_base - 1, int(t_idx * n_base / max(1, n_test)))
                
        # Project normalized baseline curves onto test frames
        base_norm = SpeakerNormalizer.get_normalized_feature_bundle(base_features)
        test_norm = SpeakerNormalizer.get_normalized_feature_bundle(test_features)
        
        base_times_aligned = base_features.time_stamps[aligned_base_idx]
        base_pitch_aligned = base_norm["pitch_semitones"][aligned_base_idx]
        base_energy_aligned = base_norm["energy_normalized"][aligned_base_idx]
        base_rate_aligned = base_norm["relative_rate"][aligned_base_idx]
        
        return AlignmentResult(
            warping_path=wp_chrono,
            dtw_distance=dtw_cost,
            test_times=test_features.time_stamps,
            base_times_aligned=base_times_aligned,
            base_pitch_aligned=base_pitch_aligned,
            test_pitch=test_norm["pitch_semitones"],
            base_energy_aligned=base_energy_aligned,
            test_energy=test_norm["energy_normalized"],
            base_rate_aligned=base_rate_aligned,
            test_rate=test_norm["relative_rate"]
        )
