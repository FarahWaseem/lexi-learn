// src/components/features/VoiceRecorder/AudioVisualizer.jsx
import React, { useEffect, useRef } from 'react';

const AudioVisualizer = ({ audioContext, analyser, isRecording }) => {
  const canvasRef = useRef();
  const animationRef = useRef();

  useEffect(() => {
    if (!analyser || !isRecording) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgb(240, 240, 240)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(59, 130, 246)';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, isRecording]);

  if (!isRecording) return null;

  return (
    <div className="mt-3">
      <canvas 
        ref={canvasRef} 
        width="300" 
        height="80"
        className="border rounded-lg"
      />
    </div>
  );
};

export default AudioVisualizer;