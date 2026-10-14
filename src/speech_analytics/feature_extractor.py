"""
feature_extractor.py: Forensic acoustic & phonetic feature extraction engine.
Combines sub-hertz FFT-autocorrelation pitch tracking, Praat Parselmouth voice quality
(HNR, Jitter, Shimmer, Formants F1/F2/F3), dynamic range envelopes, and vowel sonority velocity.
"""

from dataclasses import dataclass, field
import numpy as np
import scipy.signal
import librosa
import parselmouth
from parselmouth.praat import call


@dataclass
class ForensicVoiceQuality:
    mean_pitch_hz: float = 0.0
    f1_mean_hz: float = 0.0
    f2_mean_hz: float = 0.0
    f3_mean_hz: float = 0.0
    hnr_db: float = 0.0
    jitter_local_percent: float = 0.0
    shimmer_local_percent: float = 0.0
    vocal_strain_index: float = 0.0


@dataclass
class AcousticFeatures:
    sample_rate: int
    duration_sec: float
    time_stamps: np.ndarray             # Frame center times in seconds
    f0_hz: np.ndarray                   # Fundamental frequency in Hz (NaN for unvoiced)
    f0_semitones: np.ndarray            # Pitch in semitones relative to median
    voiced_mask: np.ndarray             # Boolean voiced/unvoiced decision
    rms_energy: np.ndarray              # Root-mean-square energy curve
    rms_db: np.ndarray                  # Energy in decibels
    speech_rate_curve: np.ndarray       # Local syllable velocity (syllables/sec)
    pauses: list[dict] = field(default_factory=list) # Detected silence/pause regions
    mfcc: np.ndarray = field(default_factory=lambda: np.zeros((13, 0))) # 13 MFCCs
    spectral_centroid: np.ndarray = field(default_factory=lambda: np.array([]))
    spectral_rolloff: np.ndarray = field(default_factory=lambda: np.array([]))
    spectral_flatness: np.ndarray = field(default_factory=lambda: np.array([]))
    
    # Forensic Praat metrics
    forensic_voice: ForensicVoiceQuality = field(default_factory=ForensicVoiceQuality)
    
    # Summary scalar statistics
    mean_f0: float = 0.0
    f0_std_semitones: float = 0.0
    f0_range_semitones: float = 0.0
    mean_speech_rate: float = 0.0
    mean_wpm: float = 0.0
    total_pause_duration_sec: float = 0.0
    pause_speech_ratio: float = 0.0
    dynamic_range_db: float = 0.0


class AcousticFeatureExtractor:
    """Forensic phonetic and oratorical acoustic extraction suite."""
    
    def __init__(self, sample_rate: int = 22050, hop_length: int = 512, frame_length: int = 2048):
        self.sr = sample_rate
        self.hop_length = hop_length
        self.frame_length = frame_length
        
    def extract_f0_autocorr(self, audio: np.ndarray, fmin: float = 65.0, fmax: float = 500.0) -> tuple[np.ndarray, np.ndarray]:
        """Sub-hertz FFT-autocorrelation pitch tracker with parabolic interpolation."""
        n_frames = 1 + int((len(audio) - self.frame_length) / self.hop_length)
        if n_frames <= 0:
            return np.array([]), np.array([])
            
        min_lag = max(1, int(self.sr / fmax))
        max_lag = min(self.frame_length - 1, int(self.sr / fmin))
        
        f0 = np.full(n_frames, np.nan, dtype=np.float64)
        voiced = np.zeros(n_frames, dtype=bool)
        
        frames = librosa.util.frame(audio, frame_length=self.frame_length, hop_length=self.hop_length)
        window = np.hanning(self.frame_length)[:, None]
        windowed = frames * window
        
        n_fft = 2 ** int(np.ceil(np.log2(2 * self.frame_length)))
        fft_frames = np.fft.rfft(windowed, n=n_fft, axis=0)
        corr = np.fft.irfft(np.abs(fft_frames) ** 2, n=n_fft, axis=0)[:self.frame_length, :]
        zero_lag = corr[0, :]
        eps = 1e-7
        
        for i in range(n_frames):
            if zero_lag[i] < eps:
                continue
            norm_corr = corr[:, i] / (zero_lag[i] + eps)
            search_region = norm_corr[min_lag:max_lag]
            if len(search_region) == 0:
                continue
            
            peak_offset = np.argmax(search_region)
            peak_idx = min_lag + peak_offset
            peak_val = norm_corr[peak_idx]
            
            if peak_val > 0.35:
                if 0 < peak_idx < self.frame_length - 1:
                    y0 = norm_corr[peak_idx - 1]
                    y1 = norm_corr[peak_idx]
                    y2 = norm_corr[peak_idx + 1]
                    denom = y0 - 2 * y1 + y2
                    delta = 0.5 * (y0 - y2) / denom if abs(denom) > 1e-8 else 0.0
                    true_lag = peak_idx + delta
                else:
                    true_lag = float(peak_idx)
                    
                if true_lag > 0:
                    pitch = self.sr / true_lag
                    if fmin <= pitch <= fmax:
                        f0[i] = pitch
                        voiced[i] = True
                        
        voiced_indices = np.where(voiced)[0]
        if len(voiced_indices) > 5:
            voiced_pitches = f0[voiced_indices]
            med_filtered = scipy.signal.medfilt(voiced_pitches, kernel_size=5)
            f0[voiced_indices] = med_filtered
            
        return f0, voiced

    def extract_praat_forensics(self, audio: np.ndarray) -> ForensicVoiceQuality:
        """Extracts Praat gold-standard voice quality: Formants (Burg), HNR, Jitter, Shimmer."""
        try:
            snd = parselmouth.Sound(audio.astype(np.float64), sampling_frequency=float(self.sr))
            
            # Formants via Burg algorithm
            formants = snd.to_formant_burg(max_number_of_formants=5.0, maximum_formant=5500.0)
            f1 = float(call(formants, 'Get mean', 1, 0, 0, 'Hertz'))
            f2 = float(call(formants, 'Get mean', 2, 0, 0, 'Hertz'))
            f3 = float(call(formants, 'Get mean', 3, 0, 0, 'Hertz'))
            
            # Harmonics to noise ratio (HNR)
            harmonicity = snd.to_harmonicity()
            hnr = float(call(harmonicity, 'Get mean', 0, 0))
            
            # PointProcess for perturbation
            point_proc = call(snd, 'To PointProcess (periodic, cc)', 75, 500)
            jitter = float(call(point_proc, 'Get jitter (local)', 0, 0, 0.0001, 0.02, 1.3)) * 100.0
            shimmer = float(call([snd, point_proc], 'Get shimmer (local)', 0, 0, 0.0001, 0.02, 1.3, 1.6)) * 100.0
            
            # Mean Pitch
            pitch = snd.to_pitch()
            mean_pitch = float(call(pitch, 'Get mean', 0, 0, 'Hertz'))
            
            # Vocal strain index (composite of high jitter, high shimmer, low HNR)
            strain = max(0.0, min(100.0, (jitter * 20.0 + shimmer * 5.0 + max(0.0, 15.0 - hnr) * 4.0)))
            
            return ForensicVoiceQuality(
                mean_pitch_hz=round(0.0 if np.isnan(mean_pitch) else mean_pitch, 1),
                f1_mean_hz=round(0.0 if np.isnan(f1) else f1, 1),
                f2_mean_hz=round(0.0 if np.isnan(f2) else f2, 1),
                f3_mean_hz=round(0.0 if np.isnan(f3) else f3, 1),
                hnr_db=round(0.0 if np.isnan(hnr) else hnr, 2),
                jitter_local_percent=round(0.0 if np.isnan(jitter) else jitter, 3),
                shimmer_local_percent=round(0.0 if np.isnan(shimmer) else shimmer, 3),
                vocal_strain_index=round(strain, 1)
            )
        except Exception:
            return ForensicVoiceQuality()

    def extract_rms_energy(self, audio: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Calculates smoothed RMS energy and decibel envelope."""
        rms = librosa.feature.rms(y=audio, frame_length=self.frame_length, hop_length=self.hop_length)[0]
        window = scipy.signal.windows.gaussian(7, std=1.8)
        window /= np.sum(window)
        smoothed_rms = np.convolve(rms, window, mode='same')
        max_rms = np.max(smoothed_rms) + 1e-8
        rms_db = 20 * np.log10(np.maximum(smoothed_rms, 1e-5) / max_rms)
        return smoothed_rms, rms_db

    def detect_pauses(self, rms_db: np.ndarray, time_stamps: np.ndarray, 
                      silence_threshold_db: float = -32.0, min_duration_sec: float = 0.22) -> list[dict]:
        """Detects pause / silence regions exceeding min_duration_sec."""
        is_silent = rms_db < silence_threshold_db
        pauses = []
        in_pause = False
        start_idx = 0
        
        for i, silent in enumerate(is_silent):
            if silent and not in_pause:
                in_pause = True
                start_idx = i
            elif not silent and in_pause:
                in_pause = False
                dur = time_stamps[i] - time_stamps[start_idx]
                if dur >= min_duration_sec:
                    pauses.append({
                        "start_sec": round(float(time_stamps[start_idx]), 3),
                        "end_sec": round(float(time_stamps[i]), 3),
                        "duration_sec": round(float(dur), 3),
                        "start_ms": int(time_stamps[start_idx] * 1000),
                        "end_ms": int(time_stamps[i] * 1000)
                    })
                    
        if in_pause:
            dur = time_stamps[-1] - time_stamps[start_idx]
            if dur >= min_duration_sec:
                pauses.append({
                    "start_sec": round(float(time_stamps[start_idx]), 3),
                    "end_sec": round(float(time_stamps[-1]), 3),
                    "duration_sec": round(float(dur), 3),
                    "start_ms": int(time_stamps[start_idx] * 1000),
                    "end_ms": int(time_stamps[-1] * 1000)
                })
                
        return pauses

    def extract_speech_rate(self, audio: np.ndarray, n_frames: int) -> np.ndarray:
        """Estimates continuous syllable rate curve via vowel sonority peaks."""
        sos = scipy.signal.butter(4, [300, 3300], btype='bandpass', fs=self.sr, output='sos')
        filtered = scipy.signal.sosfilt(sos, audio)
        
        window_len = int(0.04 * self.sr)
        env = np.sqrt(np.convolve(filtered ** 2, np.ones(window_len) / window_len, mode='same'))
        env /= (np.max(env) + 1e-8)
        
        env_frames = env[::self.hop_length][:n_frames]
        min_distance = max(1, int(0.14 * self.sr / self.hop_length))
        peaks, _ = scipy.signal.find_peaks(env_frames, height=0.08, distance=min_distance, prominence=0.06)
        
        impulses = np.zeros(n_frames)
        impulses[peaks] = 1.0
        
        win_std_frames = max(2, min(int(1.2 * self.sr / self.hop_length), max(3, n_frames // 4)))
        k_len = min(n_frames if n_frames % 2 != 0 else n_frames - 1, win_std_frames * 6 + 1)
        k_len = max(3, k_len)
        if k_len % 2 == 0:
            k_len += 1
        gw = scipy.signal.windows.gaussian(k_len, std=win_std_frames)
        gw /= np.sum(gw)
        
        conv = np.convolve(impulses, gw, mode='same')
        rate_curve = conv[:n_frames] * (self.sr / self.hop_length)
        if len(rate_curve) < n_frames:
            rate_curve = np.pad(rate_curve, (0, n_frames - len(rate_curve)))
        return rate_curve

    def process(self, audio: np.ndarray) -> AcousticFeatures:
        """Complete acoustic & Praat phonetic feature extraction pipeline."""
        if audio.ndim > 1:
            audio = np.mean(audio, axis=1)
            
        duration = len(audio) / self.sr
        
        # 1. Pitch / F0
        f0_hz, voiced = self.extract_f0_autocorr(audio)
        n_frames = len(f0_hz)
        time_stamps = librosa.frames_to_time(np.arange(n_frames), sr=self.sr, hop_length=self.hop_length)
        
        # Semitone conversion relative to median voiced pitch
        voiced_pitches = f0_hz[voiced]
        if len(voiced_pitches) > 0:
            median_f0 = float(np.median(voiced_pitches))
            mean_f0 = float(np.mean(voiced_pitches))
            f0_semitones = np.full(n_frames, np.nan)
            f0_semitones[voiced] = 12.0 * np.log2(voiced_pitches / median_f0)
            f0_std_semitones = float(np.std(f0_semitones[voiced]))
            f0_range_semitones = float(np.ptp(f0_semitones[voiced]))
        else:
            mean_f0 = 120.0
            f0_semitones = np.zeros(n_frames)
            f0_std_semitones = 0.0
            f0_range_semitones = 0.0
            
        # 2. RMS Energy & Decibels
        rms, rms_db = self.extract_rms_energy(audio)
        rms = rms[:n_frames]
        rms_db = rms_db[:n_frames]
        p95 = np.percentile(rms_db, 95)
        p10 = np.percentile(rms_db, 10)
        dynamic_range = float(p95 - p10)
        
        # 3. Pauses
        pauses = self.detect_pauses(rms_db, time_stamps)
        total_pause_dur = sum(p["duration_sec"] for p in pauses)
        pause_ratio = total_pause_dur / (duration + 1e-6)
        
        # 4. Speech Rate & Syllable Dynamics
        speech_rate = self.extract_speech_rate(audio, n_frames)
        mean_rate = float(np.mean(speech_rate))
        mean_wpm = float(mean_rate * 60.0 / 1.45)
        
        # 5. Spectral Features
        mfcc = librosa.feature.mfcc(y=audio, sr=self.sr, n_mfcc=13, hop_length=self.hop_length)[:, :n_frames]
        spectral_centroid = librosa.feature.spectral_centroid(y=audio, sr=self.sr, hop_length=self.hop_length)[0, :n_frames]
        spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=self.sr, hop_length=self.hop_length, roll_percent=0.85)[0, :n_frames]
        spectral_flatness = librosa.feature.spectral_flatness(y=audio, hop_length=self.hop_length)[0, :n_frames]
        
        # 6. Praat Forensic Voice Quality
        forensic_voice = self.extract_praat_forensics(audio)
        
        return AcousticFeatures(
            sample_rate=self.sr,
            duration_sec=duration,
            time_stamps=time_stamps,
            f0_hz=f0_hz,
            f0_semitones=f0_semitones,
            voiced_mask=voiced,
            rms_energy=rms,
            rms_db=rms_db,
            speech_rate_curve=speech_rate,
            pauses=pauses,
            mfcc=mfcc,
            spectral_centroid=spectral_centroid,
            spectral_rolloff=spectral_rolloff,
            spectral_flatness=spectral_flatness,
            forensic_voice=forensic_voice,
            mean_f0=mean_f0,
            f0_std_semitones=f0_std_semitones,
            f0_range_semitones=f0_range_semitones,
            mean_speech_rate=mean_rate,
            mean_wpm=mean_wpm,
            total_pause_duration_sec=total_pause_dur,
            pause_speech_ratio=pause_ratio,
            dynamic_range_db=dynamic_range
        )
