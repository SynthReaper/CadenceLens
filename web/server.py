"""
server.py: Production FastAPI REST server for CadenceLens.
Serves interactive web dashboard, Praat forensic voice quality metrics,
word-level forced alignment, audio files, and live microphone analysis.
"""

import os
import io
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from src.speech_analytics.pipeline import SpeechAnalyticsPipeline
from src.speech_analytics.synthesizer import CORPUS

app = FastAPI(
    title="CadenceLens API",
    description="Contrastive Speech Analytics & Forensic Phonetic Grounding Platform",
    version="2.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = SpeechAnalyticsPipeline()

web_dir = os.path.dirname(__file__)
static_dir = os.path.join(web_dir, "static")
templates_dir = os.path.join(web_dir, "templates")

app.mount("/static", StaticFiles(directory=static_dir), name="static")


def get_manifest():
    manifest_path = os.path.join(os.path.dirname(web_dir), "dataset", "dataset_manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"speeches": {}}


@app.api_route("/", methods=["GET", "HEAD"], response_class=HTMLResponse)
async def serve_index():
    index_path = os.path.join(templates_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>CadenceLens UI is loading...</h1>"


@app.get("/api/health")
async def health_check():
    """Health check endpoint for Render, monitoring, and telemetry."""
    return {
        "status": "healthy",
        "service": "CadenceLens Forensic Acoustic Engine",
        "version": "2.4.0",
        "author": "SynthReaper",
        "praat_parselmouth": True
    }


@app.get("/api/speeches")
async def list_speeches():
    """Returns available corpus speeches, metadata, and word alignments."""
    manifest = get_manifest()
    if manifest.get("speeches"):
        return manifest["speeches"]
            
    return {
        key: {
            "title": val["title"],
            "speaker": val["speaker"],
            "transcript": val["transcript"],
            "tiers": ["tier_1_near_perfect", "tier_2_moderate_flaws", "tier_3_severe_flaws", "tier_4_botched"]
        }
        for key, val in CORPUS.items()
    }


@app.get("/api/audio/{speech_key}/{tier}")
async def get_audio_file(speech_key: str, tier: str):
    """Serves audio files from the dataset directory."""
    root_dir = os.path.dirname(web_dir)
    filename = "baseline.wav" if tier == "baseline" else f"{tier}.wav"
    audio_path = os.path.join(root_dir, "dataset", "speeches", speech_key, filename)
    
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
        
    return FileResponse(audio_path, media_type="audio/wav")


@app.post("/api/evaluate/preset")
async def evaluate_preset(speech_key: str = Form(...), tier: str = Form(...)):
    """Evaluates a preset tier against its baseline with Praat forensics and word-level alignment."""
    root_dir = os.path.dirname(web_dir)
    base_path = os.path.join(root_dir, "dataset", "speeches", speech_key, "baseline.wav")
    filename = "baseline.wav" if tier == "baseline" else f"{tier}.wav"
    test_path = os.path.join(root_dir, "dataset", "speeches", speech_key, filename)
    
    if not os.path.exists(base_path) or not os.path.exists(test_path):
        raise HTTPException(status_code=404, detail="Requested speech audio files not found on disk")
        
    manifest = get_manifest()
    speech_meta = manifest.get("speeches", {}).get(speech_key, {})
    transcript = speech_meta.get("transcript", CORPUS.get(speech_key, {}).get("transcript", ""))
    word_boundaries = speech_meta.get("words", [])
    
    try:
        evaluation = pipeline.evaluate(base_path, test_path, transcript=transcript, word_boundaries=word_boundaries)
        evaluation["speech_info"] = {
            "speech_key": speech_key,
            "tier": tier,
            "title": speech_meta.get("title", CORPUS.get(speech_key, {}).get("title", speech_key)),
            "speaker": speech_meta.get("speaker", CORPUS.get(speech_key, {}).get("speaker", "Unknown")),
            "voice_model": speech_meta.get("voice_model", "Neural Studio"),
            "transcript": transcript,
            "base_audio_url": f"/api/audio/{speech_key}/baseline",
            "test_audio_url": f"/api/audio/{speech_key}/{tier}"
        }
        return JSONResponse(content=evaluation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@app.post("/api/evaluate/upload")
async def evaluate_upload(
    audio_file: UploadFile = File(...),
    preset_baseline: str = Form("jfk_inaugural"),
    transcript: str = Form("")
):
    """Evaluates a user-uploaded or live-recorded microphone audio against selected baseline."""
    root_dir = os.path.dirname(web_dir)
    base_path = os.path.join(root_dir, "dataset", "speeches", preset_baseline, "baseline.wav")
    
    if not os.path.exists(base_path):
        raise HTTPException(status_code=404, detail=f"Baseline {preset_baseline} not found")
        
    contents = await audio_file.read()
    manifest = get_manifest()
    speech_meta = manifest.get("speeches", {}).get(preset_baseline, {})
    
    if not transcript:
        transcript = speech_meta.get("transcript", CORPUS.get(preset_baseline, {}).get("transcript", ""))
    word_boundaries = speech_meta.get("words", [])
        
    try:
        evaluation = pipeline.evaluate(base_path, contents, transcript=transcript, word_boundaries=word_boundaries)
        evaluation["speech_info"] = {
            "speech_key": preset_baseline,
            "tier": "user_recording",
            "title": f"Live Participant Voice ({audio_file.filename or 'Microphone'})",
            "speaker": "You (Participant)",
            "voice_model": "Live Acoustic Input",
            "transcript": transcript,
            "base_audio_url": f"/api/audio/{preset_baseline}/baseline",
            "test_audio_url": None
        }
        return JSONResponse(content=evaluation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Uploaded audio evaluation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("web.server:app", host="127.0.0.1", port=8000, reload=True)
