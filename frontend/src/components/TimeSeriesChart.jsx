import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function TimeSeriesChart({
  visualization,
  flaws = [],
  metric = 'pitch',
  activeMetric,
  onSeekTime
}) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !visualization) return;

    const ctx = canvasRef.current.getContext('2d');
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const timestamps = visualization.timestamps || [];
    if (timestamps.length === 0) return;

    const currentMetric = activeMetric || metric || 'pitch';
    let baseData = [];
    let testData = [];
    let yLabel = 'Pitch Semitones (Rel. to Median)';
    let unit = ' ST';
    let suggestedMin = -3.0;
    let suggestedMax = 3.0;

    if (currentMetric === 'pitch') {
      baseData = visualization.base_pitch_semitones || visualization.base_pitch || [];
      testData = visualization.test_pitch_semitones || visualization.test_pitch || [];
      yLabel = 'Pitch Semitones (Rel. to Median)';
      unit = ' ST';
      suggestedMin = -3.5;
      suggestedMax = 3.5;
    } else if (currentMetric === 'energy') {
      baseData = visualization.base_energy || [];
      testData = visualization.test_energy || [];
      yLabel = 'RMS Amplitude (0 - 1.0)';
      unit = '';
      suggestedMin = 0.0;
      suggestedMax = 1.0;
    } else if (currentMetric === 'rate') {
      baseData = visualization.base_rate || [];
      testData = visualization.test_rate || [];
      yLabel = 'Speech Velocity (Syllables/s)';
      unit = ' syl/s';
      suggestedMin = 0.0;
      suggestedMax = 5.0;
    }

    // Downsample if more than 250 points for smooth canvas rendering
    const step = Math.max(1, Math.floor(timestamps.length / 250));
    const filteredLabels = [];
    const filteredBase = [];
    const filteredTest = [];

    const cleanVal = (v) => {
      if (v === null || v === undefined) return null;
      const num = Number(v);
      return isNaN(num) ? null : num;
    };

    for (let i = 0; i < timestamps.length; i += step) {
      const rawT = timestamps[i];
      const tLabel = typeof rawT === 'number' ? rawT.toFixed(2) : String(rawT);
      filteredLabels.push(tLabel);
      filteredBase.push(cleanVal(baseData[i]));
      filteredTest.push(cleanVal(testData[i]));
    }

    // Create Flaw Annotation Shading Plugin
    const flawPlugin = {
      id: 'flawShading',
      beforeDraw: (chart) => {
        if (!flaws || flaws.length === 0 || filteredLabels.length === 0) return;
        const { ctx, chartArea, scales } = chart;
        if (!chartArea || !scales || !scales.x) return;
        const { top, bottom } = chartArea;
        const { x } = scales;
        
        ctx.save();
        flaws.forEach((flaw) => {
          if (!flaw) return;
          const fStart = flaw.interval_start ?? flaw.start_sec;
          const fEnd = flaw.interval_end ?? flaw.end_sec;
          if (typeof fStart !== 'number' || typeof fEnd !== 'number') return;
          
          let startIndex = filteredLabels.findIndex(l => parseFloat(l) >= fStart);
          let endIndex = filteredLabels.findIndex(l => parseFloat(l) >= fEnd);
          if (startIndex === -1) startIndex = 0;
          if (endIndex === -1) endIndex = filteredLabels.length - 1;
          if (endIndex < startIndex) endIndex = startIndex;

          const startX = x.getPixelForValue(startIndex);
          const endX = x.getPixelForValue(endIndex);
          const width = Math.max(endX - startX, 8);

          ctx.fillStyle = flaw.severity === 'HIGH' || flaw.severity === 'CRITICAL'
            ? 'rgba(203, 73, 20, 0.15)' 
            : 'rgba(217, 119, 6, 0.12)';
          ctx.fillRect(startX, top, width, bottom - top);

          ctx.strokeStyle = flaw.severity === 'HIGH' || flaw.severity === 'CRITICAL'
            ? 'rgba(203, 73, 20, 0.8)' 
            : 'rgba(217, 119, 6, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(startX, top, width, bottom - top);
        });
        ctx.restore();
      }
    };

    try {
      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: filteredLabels,
          datasets: [
            {
              label: 'Baseline Master Reference',
              data: filteredBase,
              borderColor: '#37613d',
              backgroundColor: 'rgba(55, 97, 61, 0.05)',
              borderWidth: 2.2,
              borderDash: [5, 4],
              pointRadius: 1,
              pointHoverRadius: 4,
              tension: 0.3,
              spanGaps: true,
            },
            {
              label: 'Evaluated Delivery Utterance',
              data: filteredTest,
              borderColor: '#cb4914',
              backgroundColor: 'rgba(203, 73, 20, 0.08)',
              fill: true,
              borderWidth: 2.5,
              pointRadius: 1,
              pointHoverRadius: 4,
              tension: 0.3,
              spanGaps: true,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          onClick: (e, elements, chart) => {
            if (!onSeekTime || !canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const xPos = e.clientX - rect.left;
            const { scales: { x } } = chart;
            if (x) {
              const index = x.getValueForPixel(xPos);
              if (index >= 0 && index < filteredLabels.length) {
                const timeSec = parseFloat(filteredLabels[index]);
                if (!isNaN(timeSec)) onSeekTime(timeSec);
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                font: { family: 'Space Mono', size: 11, weight: 'bold' },
                color: '#1e1b19',
                boxWidth: 14,
              }
            },
            tooltip: {
              backgroundColor: '#1e1b19',
              titleFont: { family: 'Space Mono', size: 11 },
              bodyFont: { family: 'Space Mono', size: 11 },
              callbacks: {
                title: (items) => `Time: ${items[0]?.label}s`,
                label: (item) => `${item.dataset.label}: ${item.raw !== null ? Number(item.raw).toFixed(2) + unit : 'N/A'}`
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Warped Aligned Time (seconds)',
                font: { family: 'Space Mono', size: 10, weight: 'bold' },
                color: '#594139'
              },
              grid: { color: '#e5d8d0' },
              ticks: {
                font: { family: 'Space Mono', size: 9 },
                color: '#594139',
                maxTicksLimit: 14,
              }
            },
            y: {
              title: {
                display: true,
                text: yLabel,
                font: { family: 'Space Mono', size: 10, weight: 'bold' },
                color: '#594139'
              },
              grid: { color: '#e5d8d0' },
              suggestedMin: suggestedMin,
              suggestedMax: suggestedMax,
              ticks: {
                font: { family: 'Space Mono', size: 9 },
                color: '#594139'
              }
            }
          }
        },
        plugins: [flawPlugin]
      });
    } catch (chartErr) {
      console.warn("Chart creation error:", chartErr);
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [visualization, flaws, metric, activeMetric]);

  return (
    <div className="w-full h-64 relative bg-[#fffdfa] border border-[#e5d8d0] rounded-lg p-2">
      <canvas ref={canvasRef} />
    </div>
  );
}
