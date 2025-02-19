'use client';

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { TimelineClip } from "@/types"
import { cn } from "@/lib/utils"
import { Video, Music, Scissors, Combine, CropIcon, Trash } from 'lucide-react'
import { videoService } from '@/utils/videoService';
import { toast } from '@/hooks/use-toast';

interface TimelineProps {
  projectId: string;
  duration: number;
  onTimeUpdate?: (time: number) => void;
  onClipsChange?: (clips: TimelineClip[]) => void;
  currentTime: number;
  selectedClipId?: string;
  onClipSelect?: (clipId: string | null) => void;
  className?: string;
}

const SNAP_THRESHOLD = 10 // pixels
const THUMBNAIL_LOADING_COLOR = "bg-blue-500/20" // Temporary color while frames load

export default function Timeline({ projectId, duration, onTimeUpdate, onClipsChange, currentTime, selectedClipId, onClipSelect, className }: TimelineProps) {
  const [clips, setClips] = useState<TimelineClip[]>([])
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedClip, setDraggedClip] = useState<TimelineClip | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const timelineRef = useRef<HTMLDivElement>(null)
  const [tracks, setTracks] = useState(8) // Default number of tracks
  const [frameCache, setFrameCache] = useState<Record<string, string[]>>({})
  const [isPlaying, setIsPlaying] = useState(false)
  const playbackRef = useRef<NodeJS.Timeout | null>(null)
  const [videoTracks, setVideoTracks] = useState(4) // Video tracks
  const [audioTracks, setAudioTracks] = useState(4) // Audio tracks
  const totalTracks = videoTracks + audioTracks
  const [isProcessing, setIsProcessing] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const timelineContainerRef = useRef<HTMLDivElement>(null)

  const FRAME_RATE = 30 // Standard frame rate
  const SECONDS_PER_MINUTE = 60
  const PIXELS_PER_FRAME = 2 // Base pixels per frame when fully zoomed in
  const TRACK_HEIGHT = 80
  const FRAMES_PER_CLIP = 20 // Number of frame thumbnails to show per clip

  // Calculate timeline metrics based on zoom
  const getTimelineMetrics = () => {
    if (zoom >= 1) {
      // Frame-level view (zoomed in)
      return {
        unit: 'frame',
        pixelsPerUnit: PIXELS_PER_FRAME * zoom,
        unitsPerMajorTick: FRAME_RATE, // 1 second worth of frames
        labelFormatter: (value: number) => `${Math.floor(value / FRAME_RATE)}:${(value % FRAME_RATE).toString().padStart(2, '0')}`
      }
    } else if (zoom >= 0.3) {
      // Seconds-level view
      return {
        unit: 'second',
        pixelsPerUnit: PIXELS_PER_FRAME * FRAME_RATE * zoom,
        unitsPerMajorTick: 5, // 5-second intervals
        labelFormatter: (value: number) => `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`
      }
    } else {
      // Minutes-level view (zoomed out)
      return {
        unit: 'minute',
        pixelsPerUnit: PIXELS_PER_FRAME * FRAME_RATE * SECONDS_PER_MINUTE * zoom,
        unitsPerMajorTick: 1,
        labelFormatter: (value: number) => `${value}m`
      }
    }
  }

  // Update total duration when clips change
  useEffect(() => {
    const maxEnd = Math.max(...clips.map(clip => clip.end), 0)
    setTotalDuration(maxEnd)
  }, [clips])

  // Handle horizontal scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (timelineContainerRef.current) {
      setScrollPosition(timelineContainerRef.current.scrollLeft)
    }
  }

  // Frame-by-frame navigation
  const navigateFrames = (direction: 'prev' | 'next') => {
    const frameTime = 1 / FRAME_RATE
    const newTime = direction === 'next'
      ? currentTime + frameTime
      : Math.max(0, currentTime - frameTime)
    onTimeUpdate?.(newTime)
  }

  // Extract frames from video for thumbnails
  const extractFrames = async (clip: TimelineClip) => {
    if (clip.asset.type !== 'video' || frameCache[clip.id]) return

    const frames: string[] = []
    const video = document.createElement('video')
    video.src = clip.asset.url
    await new Promise((resolve) => (video.onloadedmetadata = resolve))

    const duration = clip.end - clip.start
    const interval = duration / FRAMES_PER_CLIP
    
    for (let i = 0; i < FRAMES_PER_CLIP; i++) {
      const time = clip.start + (i * interval)
      video.currentTime = time
      
      await new Promise((resolve) => (video.onseeked = resolve))
      
      const canvas = document.createElement('canvas')
      canvas.width = 160  // Thumbnail width
      canvas.height = 90  // Thumbnail height (16:9 ratio)
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
      frames.push(canvas.toDataURL())
    }

    setFrameCache(prev => ({ ...prev, [clip.id]: frames }))
  }

  // Handle clip dragging
  const handleClipMouseDown = (e: React.MouseEvent, clip: TimelineClip) => {
    e.preventDefault()
    onClipSelect?.(clip.id)
    
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setDraggedClip(clip)
    setIsDragging(true)
  }

  // Handle timeline click for playhead positioning
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newTime = Math.max(0, x / getTimelineMetrics().pixelsPerUnit)
    onTimeUpdate?.(newTime)
  }

  // Handle playback
  const startPlayback = () => {
    setIsPlaying(true)
    playbackRef.current = setInterval(() => {
      const lastClipEnd = Math.max(...clips.map(clip => clip.end), 0)
      if (currentTime >= lastClipEnd) {
        stopPlayback()
        onTimeUpdate?.(0)   
      } else {
        onTimeUpdate?.(currentTime + 0.033) // Approximately 30fps
      }
    }, 33)
  }

  const stopPlayback = () => {
    if (playbackRef.current) {
      clearInterval(playbackRef.current)
      playbackRef.current = null
    }
    setIsPlaying(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current)
      }
    }
  }, [])

  // Modified handleMouseMove to include snapping
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedClip || !timelineRef.current) return

    const timelineRect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - timelineRect.left - dragOffset.x
    const y = e.clientY - timelineRect.top - dragOffset.y

    let newTime = Math.max(0, x / getTimelineMetrics().pixelsPerUnit)
    
    // Determine valid track range based on clip type
    const isVideoClip = draggedClip.asset.type === 'video'
    const minTrack = isVideoClip ? 0 : videoTracks
    const maxTrack = isVideoClip ? videoTracks - 1 : totalTracks - 1
    
    const newTrack = Math.max(minTrack, Math.min(maxTrack, Math.floor(y / TRACK_HEIGHT)))
    
    const duration = draggedClip.end - draggedClip.start

    // Check for snapping
    const snapPoints = clips
      .filter(c => c.id !== draggedClip.id && c.trackIndex === newTrack)
      .flatMap(c => [
        { time: c.start, type: 'start' },
        { time: c.end, type: 'end' }
      ])

    // Check snap to start and end of dragged clip
    for (const point of snapPoints) {
      // Snap start of dragged clip to end of other clips
      if (Math.abs((newTime - point.time) * getTimelineMetrics().pixelsPerUnit) < SNAP_THRESHOLD) {
        newTime = point.time
        break
      }
      // Snap end of dragged clip to start of other clips
      if (Math.abs((newTime + duration - point.time) * getTimelineMetrics().pixelsPerUnit) < SNAP_THRESHOLD) {
        newTime = point.time - duration
        break
      }
    }
    
    setClips(prev => prev.map(c => 
      c.id === draggedClip.id
        ? {
            ...c,
            start: newTime,
            end: newTime + duration,
            trackIndex: newTrack
          }
        : c
    ))
  }

  // Handle clip drop
  const handleMouseUp = () => {
    setIsDragging(false)
    setDraggedClip(null)
    onClipsChange?.(clips)
  }

  // Handle media drop from import panel
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    if (!timelineRef.current) return

    const data = e.dataTransfer.getData('application/json')
    if (!data) return

    const asset = JSON.parse(data)
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const dropTime = Math.max(0, x / getTimelineMetrics().pixelsPerUnit)
    const trackIndex = Math.max(0, Math.min(tracks - 1, Math.floor(y / TRACK_HEIGHT)))

    const newClip: TimelineClip = {
      id: crypto.randomUUID(),
      asset,
      start: dropTime,
      end: dropTime + (asset.duration || 5),
      trackIndex
    }

    setClips(prev => [...prev, newClip])
    onClipsChange?.([...clips, newClip])

    // Extract frames for the new clip if it's a video
    if (asset.type === 'video') {
      await extractFrames(newClip)
    }
  }

  // Generate thumbnail for video clips
  const generateThumbnail = async (clip: TimelineClip) => {
    if (clip.asset.type !== 'video' || frameCache[clip.id]) return;

    try {
      const result = await videoService.generateThumbnail(
        projectId,
        clip.asset.url,
        clip.start
      );
      setFrameCache(prev => ({ 
        ...prev, 
        [clip.id]: [result.outputPath] 
      }));
    } catch (error) {
      console.error('Error generating thumbnail:', error);
    }
  };

  // Handle clip trimming
  const handleTrimClip = async (clip: TimelineClip, newStart: number, newEnd: number) => {
    if (clip.asset.type !== 'video') return;

    setIsProcessing(true);
    try {
      const result = await videoService.trimVideo(
        projectId,
        clip.asset.url,
        newStart,
        newEnd
      );

      // Update clip with new trimmed video
      const updatedClip = {
        ...clip,
        asset: {
          ...clip.asset,
          url: result.outputPath,
          duration: newEnd - newStart
        },
        start: newStart,
        end: newEnd
      };

      setClips(prev => prev.map(c => 
        c.id === clip.id ? updatedClip : c
      ));
      onClipsChange?.(clips);

      // Generate new thumbnail
      await generateThumbnail(updatedClip);

      toast({
        title: 'Success',
        description: 'Video trimmed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to trim video',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle clip splitting
  const handleSplitClip = async (clip: TimelineClip, splitTime: number) => {
    if (clip.asset.type !== 'video') return;

    setIsProcessing(true);
    try {
      // Create two new clips from the split
      const firstClip = {
        ...clip,
        end: splitTime,
        id: crypto.randomUUID()
      };

      const secondClip = {
        ...clip,
        start: splitTime,
        id: crypto.randomUUID()
      };

      // Trim both clips
      const [firstResult, secondResult] = await Promise.all([
        videoService.trimVideo(
          projectId,
          clip.asset.url,
          firstClip.start,
          firstClip.end
        ),
        videoService.trimVideo(
          projectId,
          clip.asset.url,
          secondClip.start,
          secondClip.end
        )
      ]);

      // Update clips with new trimmed videos
      const updatedFirstClip = {
        ...firstClip,
        asset: {
          ...firstClip.asset,
          url: firstResult.outputPath
        }
      };

      const updatedSecondClip = {
        ...secondClip,
        asset: {
          ...secondClip.asset,
          url: secondResult.outputPath
        }
      };

      // Replace original clip with split clips
      setClips(prev => [
        ...prev.filter(c => c.id !== clip.id),
        updatedFirstClip,
        updatedSecondClip
      ]);

      // Generate thumbnails for new clips
      await Promise.all([
        generateThumbnail(updatedFirstClip),
        generateThumbnail(updatedSecondClip)
      ]);

      toast({
        title: 'Success',
        description: 'Video split successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to split video',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle clip merging
  const handleMergeClips = async (clip1: TimelineClip, clip2: TimelineClip) => {
    if (clip1.asset.type !== 'video' || clip2.asset.type !== 'video') return;

    setIsProcessing(true);
    try {
      const result = await videoService.mergeVideos(projectId, [
        { path: clip1.asset.url },
        { path: clip2.asset.url }
      ]);

      // Create new merged clip
      const mergedClip: TimelineClip = {
        id: crypto.randomUUID(),
        asset: {
          ...clip1.asset,
          url: result.outputPath,
          duration: (clip1.end - clip1.start) + (clip2.end - clip2.start)
        },
        start: Math.min(clip1.start, clip2.start),
        end: Math.max(clip1.end, clip2.end),
        trackIndex: clip1.trackIndex
      };

      // Replace original clips with merged clip
      setClips(prev => [
        ...prev.filter(c => c.id !== clip1.id && c.id !== clip2.id),
        mergedClip
      ]);

      // Generate thumbnail for new clip
      await generateThumbnail(mergedClip);

      toast({
        title: 'Success',
        description: 'Videos merged successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to merge videos',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Render timeline ruler
  const renderTimelineRuler = () => {
    const metrics = getTimelineMetrics();
    const visibleDuration = Math.max(totalDuration, 60); // At least 1 minute
    const totalUnits = Math.ceil(visibleDuration * (metrics.unit === 'frame' ? FRAME_RATE : 1));
    
    return (
      <div className="relative h-6 border-b bg-muted ml-12">
        {Array.from({ length: Math.ceil(totalUnits / metrics.unitsPerMajorTick) }).map((_, i) => {
          const value = i * metrics.unitsPerMajorTick;
          const position = value * metrics.pixelsPerUnit;
          
          return (
            <div
              key={`ruler-${value}-${i}`}
              className="absolute h-full border-l border-border flex items-center px-1"
              style={{ left: `${position}px` }}
            >
              <span className="text-xs text-muted-foreground">
                {metrics.labelFormatter(value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Modified renderClip to show loading state
  const renderClip = (clip: TimelineClip) => {
    const metrics = getTimelineMetrics()
    const width = (clip.end - clip.start) * metrics.pixelsPerUnit
    const left = clip.start * metrics.pixelsPerUnit
    const frames = frameCache[clip.id] || []
    const isLoading = clip.asset.type === 'video' && frames.length === 0
    const isSelected = clip.id === selectedClipId

    return (
      <div
        key={`clip-${clip.id}`}
        className={cn(
          "absolute h-[72px] rounded-md overflow-hidden cursor-move border",
          "hover:ring-2 hover:ring-primary",
          isDragging && draggedClip?.id === clip.id && "ring-2 ring-primary opacity-50",
          isLoading && THUMBNAIL_LOADING_COLOR,
          isSelected && "ring-2 ring-primary border-primary",
          !isSelected && "border-border",
          isProcessing && "opacity-50 pointer-events-none"
        )}
        style={{
          left: `${left}px`,
          width: `${width}px`,
          top: `${clip.trackIndex * TRACK_HEIGHT + 4}px`
        }}
        onMouseDown={(e) => handleClipMouseDown(e, clip)}
        onDoubleClick={() => {
          if (clip.asset.type === 'video') {
            handleSplitClip(clip, currentTime);
          }
        }}
      >
        {/* Clip content */}
        <div className="absolute inset-0 flex">
          {clip.asset.type === 'video' && frames.map((frame, i) => (
            <div
              key={`${clip.id}-frame-${i}`}
              className="h-full flex-grow"
              style={{ width: `${width / FRAMES_PER_CLIP}px` }}
            >
              <img
                src={frame}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {clip.asset.type === 'image' && (
            <img
              src={clip.asset.url}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Clip label */}
        <div className="absolute inset-x-0 bottom-0 bg-background/80 backdrop-blur-sm p-1">
          <p className="text-xs truncate">{clip.asset.name}</p>
        </div>
      </div>
    )
  }

  // Add track labels
  const renderTrackLabel = (index: number) => {
    const isVideoTrack = index < videoTracks
    return (
      <div 
        key={`track-label-${index}`}
        className="absolute left-0 w-12 flex items-center justify-center border-r border-border bg-background"
        style={{
          top: `${index * TRACK_HEIGHT}px`,
          height: `${TRACK_HEIGHT}px`
        }}
      >
        {isVideoTrack ? (
          <Video className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Music className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    )
  }

  // Also ensure track backgrounds have unique keys
  const renderTrackBackgrounds = () => (
    <>
      {Array.from({ length: totalTracks }).map((_, i) => (
        <div
          key={`track-bg-${i}`}
          className={cn(
            "absolute w-full border-b border-border",
            i % 2 === 0 ? "bg-background" : "bg-muted"
          )}
          style={{
            top: `${i * TRACK_HEIGHT}px`,
            height: `${TRACK_HEIGHT}px`
          }}
        />
      ))}
    </>
  );

  return (
    <Card className={cn("flex flex-col h-[300px]", className)}>
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
          >
            Zoom In
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
          >
            Zoom Out
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateFrames('prev')}
            disabled={currentTime <= 0}
          >
            Prev Frame
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateFrames('next')}
            disabled={currentTime >= totalDuration}
          >
            Next Frame
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={isPlaying ? stopPlayback : startPlayback}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {(zoom * 100).toFixed(0)}%
          </span>
        </div>

        {/* Add editing controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (selectedClipId) {
                const clip = clips.find(c => c.id === selectedClipId)
                if (clip) {
                  handleSplitClip(clip, currentTime)
                } else {
                  toast({
                    title: 'Error',
                    description: 'Select a clip to split',
                    variant: 'destructive',
                  })
                }
              }
            }}
            disabled={!selectedClipId || isProcessing}
            title="Split Clip"
          >
            <Scissors className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const selectedClips = clips.filter(c => c.trackIndex === clips.find(clip => clip.id === selectedClipId)?.trackIndex)
                .sort((a, b) => a.start - b.start)
              if (selectedClips.length >= 2) {
                handleMergeClips(selectedClips[0], selectedClips[1])
              } else {
                toast({
                  title: 'Error',
                  description: 'Select clips on the same track to merge',
                  variant: 'destructive',
                })
              }
            }}
            disabled={!selectedClipId || isProcessing}
            title="Merge Clips"
          >
            <Combine className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (selectedClipId) {
                const clip = clips.find(c => c.id === selectedClipId)
                if (clip) {
                  // Add 1 second to start and subtract 1 second from end for trimming
                  handleTrimClip(clip, clip.start + 1, clip.end - 1)
                }
              } else {
                toast({
                  title: 'Error',
                  description: 'Select a clip to trim',
                  variant: 'destructive',
                })
              }
            }}
            disabled={!selectedClipId || isProcessing}
            title="Trim Clip"
          >
            <CropIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (selectedClipId) {
                setClips(clips.filter(c => c.id !== selectedClipId))
                onClipsChange?.(clips.filter(c => c.id !== selectedClipId))
                onClipSelect?.(null)
              } else {
                toast({
                  title: 'Error',
                  description: 'Select a clip to delete',
                  variant: 'destructive',
                })
              }
            }}
            disabled={!selectedClipId}
            title="Delete Clip"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {renderTimelineRuler()}

      {/* Timeline content with horizontal scroll */}
      <ScrollArea 
        ref={timelineContainerRef}
        className="flex-1 relative"
        onScroll={handleScroll}
      >
        <div 
          className="relative"
          style={{ 
            width: `${Math.max(
              totalDuration * getTimelineMetrics().pixelsPerUnit,
              timelineContainerRef.current?.clientWidth ?? 0
            )}px`,
            height: `${totalTracks * TRACK_HEIGHT}px`
          }}
        >
          {/* Track labels */}
          <div className="absolute left-0 top-0 bottom-0 w-12 z-10">
            {Array.from({ length: totalTracks }).map((_, i) => renderTrackLabel(i))}
          </div>
          
          {/* Scrollable timeline content */}
          <div 
            ref={timelineRef}
            className="relative h-full ml-12"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleTimelineClick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {/* Track backgrounds with separator */}
            <div 
              className="absolute left-0 right-0 border-b-2 border-primary/50"
              style={{ top: `${videoTracks * TRACK_HEIGHT}px` }}
            />
            
            {renderTrackBackgrounds()}

            {/* Clips */}
            {clips.map(clip => renderClip(clip))}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary z-50"
              style={{ left: `${currentTime * getTimelineMetrics().pixelsPerUnit}px` }}
            />
          </div>
        </div>
        <ScrollBar orientation="horizontal" className="select-none" />
      </ScrollArea>
    </Card>
  )
}
