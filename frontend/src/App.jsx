import React, { useState, useEffect, Component } from 'react';
import Header from './components/Header';
import StudioView from './components/StudioView';
import MicLabView from './components/MicLabView';
import BenchmarkView from './components/BenchmarkView';
import ResearchPaperView from './components/ResearchPaperView';
import Footer from './components/Footer';

// Bundled precomputed dataset for instant 0ms latency on Vercel
import precomputedData from './data/precomputed.json';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-white border-2 border-[#1e1b19] rounded-xl shadow-press space-y-4 font-mono text-xs">
          <div className="text-sm font-black text-[#cb4914] flex items-center gap-2">
            <span>🚨</span> Diagnostic Engine Notice
          </div>
          <p className="text-[#594139]">
            A view rendering exception occurred: {this.state.error?.message || "Unknown error"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#cb4914] text-white font-bold rounded-lg border border-[#1e1b19] shadow-press-xs cursor-pointer"
          >
            Reload Interface
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');
  const [selectedSpeechKey, setSelectedSpeechKey] = useState('jfk_inaugural');
  const [selectedTier, setSelectedTier] = useState('tier_2_moderate_flaws');
  
  // Synchronously initialize evaluation with precomputed data so first frame is never null
  const [evaluation, setEvaluation] = useState(() => {
    return precomputedData.evaluations?.['jfk_inaugural']?.['tier_2_moderate_flaws'] || null;
  });
  const [loading, setLoading] = useState(false);

  const speeches = precomputedData.speeches || {};

  // Load evaluation data whenever speech or tier changes
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // 1. If backend URL is set, attempt live fetch
      if (API_BASE_URL) {
        try {
          setLoading(true);
          const formData = new FormData();
          formData.append('speech_key', selectedSpeechKey);
          formData.append('tier', selectedTier);

          const res = await fetch(`${API_BASE_URL}/api/evaluate/preset`, {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              setEvaluation(data);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn("Backend fetch failed, utilizing bundled precomputed data:", err);
        }
      }

      // 2. Fallback to bundled precomputed evaluation (Instant 0ms latency for Vercel)
      const cached = precomputedData.evaluations?.[selectedSpeechKey]?.[selectedTier];
      if (cached && isMounted) {
        setEvaluation(cached);
      }
      setLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedSpeechKey, selectedTier]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col justify-between selection:bg-[#cb4914] selection:text-white">
        <div>
          <Header activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {activeTab === 'studio' && (
              <StudioView
                speeches={speeches}
                selectedSpeechKey={selectedSpeechKey}
                setSelectedSpeechKey={setSelectedSpeechKey}
                selectedTier={selectedTier}
                setSelectedTier={setSelectedTier}
                currentEvaluation={evaluation}
                loading={loading}
              />
            )}

            {activeTab === 'micLab' && (
              <MicLabView apiBaseUrl={API_BASE_URL} />
            )}

            {activeTab === 'benchmark' && (
              <BenchmarkView />
            )}

            {activeTab === 'research' && (
              <ResearchPaperView />
            )}
          </main>
        </div>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}
