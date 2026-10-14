"""
streamlit_app.py: Streamlit Companion Studio for Contrastive Speech Analytics.
Provides interactive parameter tuning, Plotly visualizations, DTW path inspection, and batch evaluation.
"""

import os
import json
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from src.speech_analytics.pipeline import SpeechAnalyticsPipeline
from src.speech_analytics.synthesizer import CORPUS

st.set_page_config(
    page_title="CadenceLens | Forensic Speech Studio",
    page_icon="🎙️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Dark Precision CSS
st.markdown("""
<style>
    .reportview-container, .main {
        background-color: #09090b;
        color: #f4f4f5;
    }
    .metric-card {
        background: #18181b;
        border: 1px solid #27272a;
        padding: 18px;
        border-radius: 10px;
        margin-bottom: 12px;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_resource
def get_pipeline():
    return SpeechAnalyticsPipeline()

pipeline = get_pipeline()

# Sidebar: Controls
st.sidebar.title("🎙️ CadenceLens")
st.sidebar.caption("IIT Mandi Multimodal AI Hackathon 2026 — Track C")

speech_keys = list(CORPUS.keys())
speech_labels = [f"{CORPUS[k]['title']} ({CORPUS[k]['speaker']})" for k in speech_keys]
selected_idx = st.sidebar.selectbox("1. Choose Speech Baseline", range(len(speech_keys)), format_func=lambda i: speech_labels[i])
selected_speech = speech_keys[selected_idx]

tiers = [
    ("tier_1_near_perfect", "Tier 1: Near-Perfect (~85)"),
    ("tier_2_moderate_flaws", "Tier 2: Moderate Flaws (~68)"),
    ("tier_3_severe_flaws", "Tier 3: Severe Flaws (~48)"),
    ("tier_4_botched", "Tier 4: Botched / Catastrophic (~32)"),
    ("baseline", "Baseline Reference (Self-Match)")
]
selected_tier = st.sidebar.selectbox("2. Choose Flaw Gradient Tier", [t[0] for t in tiers], format_func=lambda k: dict(tiers)[k])

# File paths
base_audio_path = f"dataset/speeches/{selected_speech}/baseline.wav"
test_audio_path = base_audio_path if selected_tier == "baseline" else f"dataset/speeches/{selected_speech}/{selected_tier}.wav"

transcript = CORPUS[selected_speech]["transcript"]

# Main Content
st.title("Contrastive Speech Analytics & Flaw Grounding Studio")
st.markdown(f"**Target Speech**: *{CORPUS[selected_speech]['title']}* | **Speaker**: `{CORPUS[selected_speech]['speaker']}`")

with st.expander("📜 View Rhetorical Text Transcript", expanded=True):
    st.info(f'"{transcript}"')

# Run Pipeline
with st.spinner("Running acoustic feature extraction, DTW alignment & causal flaw grounding..."):
    result = pipeline.evaluate(base_audio_path, test_audio_path, transcript=transcript)

scorecard = result["scorecard"]
summary = result["summary"]
flaws = result["flaws"]
vis = result["visualization"]

# Audio Players
col1, col2 = st.columns(2)
with col1:
    st.subheader("🔵 Baseline Reference Audio")
    st.audio(base_audio_path)
with col2:
    st.subheader("🟠 Participant / Spectrum Audio")
    st.audio(test_audio_path)

st.divider()

# High-Level Metrics
m1, m2, m3, m4, m5 = st.columns(5)
m1.metric("Composite Delivery Index", f"{scorecard['composite_delivery_index']}/100", f"Grade: {scorecard['letter_grade']}")
m2.metric("Pacing Score", f"{scorecard['pacing_score']}%")
m3.metric("Pitch Dynamism", f"{scorecard['pitch_dynamism_score']}%")
m4.metric("Stress Alignment", f"{scorecard['stress_emphasis_score']}%")
m5.metric("Fluency & Pauses", f"{scorecard['fluency_pause_score']}%")

st.markdown(f"**Executive Verdict**: {scorecard['summary_verdict']}")

st.divider()

# Interactive Time-Series Overlay
st.subheader("📈 Aligned Acoustic Time-Series Comparison")
metric_choice = st.radio("Select Acoustic Metric to Inspect", ["Pitch F0 (Semitones)", "Normalized RMS Energy", "Local Speech Velocity"], horizontal=True)

fig = go.Figure()

if metric_choice == "Pitch F0 (Semitones)":
    fig.add_trace(go.Scatter(x=vis["timestamps"], y=vis["base_pitch_semitones"], name="Baseline (Ref)", line=dict(color="#3b82f6", width=2)))
    fig.add_trace(go.Scatter(x=vis["timestamps"], y=vis["test_pitch_semitones"], name="Participant", line=dict(color="#f59e0b", width=2)))
    fig.update_layout(yaxis_title="Semitones (Relative to Median F0)")
elif metric_choice == "Normalized RMS Energy":
    fig.add_trace(go.Scatter(x=vis["timestamps"], y=vis["base_energy"], name="Baseline (Ref)", line=dict(color="#3b82f6", width=2)))
    fig.add_trace(go.Scatter(x=vis["timestamps"], y=vis["test_energy"], name="Participant", line=dict(color="#f59e0b", width=2)))
    fig.update_layout(yaxis_title="Normalized RMS Energy [0 - 1]")
else:
    fig.add_trace(go.Scatter(x=vis["timestamps"], y=vis["base_rate"], name="Baseline (Ref)", line=dict(color="#3b82f6", width=2)))
    fig.add_trace(go.Scatter(x=vis["timestamps"], y=vis["test_rate"], name="Participant", line=dict(color="#f59e0b", width=2)))
    fig.update_layout(yaxis_title="Relative Speech Velocity (v / v_mean)")

# Add flaw region highlight spans
for f in flaws:
    color = "rgba(239, 68, 68, 0.15)" if f["severity"] in ["CRITICAL", "HIGH"] else "rgba(245, 158, 11, 0.15)"
    fig.add_vrect(
        x0=f["start_sec"], x1=f["end_sec"],
        fillcolor=color, opacity=0.8,
        layer="below", line_width=1, line_dash="dash", line_color="#ef4444",
        annotation_text=f["flaw_type"][:12], annotation_position="top left"
    )

fig.update_layout(
    template="plotly_dark",
    paper_bgcolor="#09090b",
    plot_bgcolor="#121215",
    xaxis_title="Aligned Timeline (Seconds)",
    margin=dict(l=40, r=40, t=40, b=40),
    hovermode="x unified",
    height=380
)
st.plotly_chart(fig, use_container_width=True)

# Temporally Grounded Flaws & Causal Explainability
st.subheader(f"🎯 Temporally Grounded Flaws ({len(flaws)} Detected)")

if len(flaws) == 0:
    st.success("No delivery defects detected. The speech matches reference rhetorical benchmarks.")
else:
    for idx, f in enumerate(flaws, 1):
        with st.container():
            st.markdown(f"""
            <div class="metric-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="margin:0; color:#38bdf8;">#{idx} {f['flaw_type']} &mdash; <span style="color:#a1a1aa;">[{f['start_sec']}s &ndash; {f['end_sec']}s | Duration: {f['duration_sec']}s]</span></h4>
                    <span style="background:#27272a; padding:3px 10px; border-radius:6px; font-size:12px; font-weight:bold; color:#f43f5e;">{f['severity']}</span>
                </div>
                <div style="margin-top:10px; font-family:monospace; background:#09090b; padding:8px 12px; border-radius:6px; color:#67e8f9;">
                    📐 <b>Mathematical Proof:</b> {f['mathematical_proof']}
                </div>
                <p style="margin:8px 0 4px 0; color:#e4e4e7;"><b>Affected Text:</b> <i>"{f['affected_phrase']}"</i></p>
                <p style="margin:4px 0; color:#d4d4d8; font-size:13px;"><b>Acoustic Causal Rationale:</b> {f['causal_explanation']}</p>
                <div style="margin-top:6px; background:#064e3b33; border:1px solid #065f46; padding:8px 12px; border-radius:6px; color:#6ee7b7; font-size:13px;">
                    💡 <b>Actionable Coaching:</b> {f['coaching_recommendation']}
                </div>
            </div>
            """, unsafe_allow_html=True)

# Granular Telemetry Table
with st.expander("📊 Granular Acoustic Telemetry & DTW Cost"):
    st.json(summary)
