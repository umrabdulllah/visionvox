import { useRef, useEffect, useState } from 'react';
import { TimelineClip } from "@/types";

interface ProgramPlayerProps {
  currentClip: TimelineClip | null;
  autoPlay?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  isMuted?: boolean;
}

export default function ProgramPlayer({ currentClip, autoPlay = false, onTimeUpdate, isMuted = false }: ProgramPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (videoRef.current && currentClip?.asset.type === 'video') {
      videoRef.current.load();
      if (autoPlay) {
        videoRef.current.play();
      }
    }
  }, [currentClip, autoPlay]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      onTimeUpdate?.(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {currentClip ? (
        currentClip.asset.type === 'video' ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={togglePlay}
              src={currentClip.asset.url}
              playsInline
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-purple-400 transition-colors"
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                
                <div className="flex-1 h-1 bg-white/30 rounded-full">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                
                <span className="text-white text-sm">
                  {Math.floor(currentTime)}/{Math.floor(duration)}s
                </span>
              </div>
            </div>
          </>
        ) : currentClip.asset.type === 'image' ? (
          <img
            className="w-full h-full object-contain"
            src={currentClip.asset.url}
            alt="Program"
          />
        ) : null
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          No clip selected
        </div>
      )}
    </div>
  );
} 