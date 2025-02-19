'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, Volume2, VolumeX, Film, Music, Scissors, Key, ImageIcon, Download, Pencil, Settings, Wand2, Sparkles } from 'lucide-react'
import ImportMedia from "@/components/Editor/ImportMedia"
import Timeline from "@/components/Editor/Timeline"
import { useRouter } from 'next/navigation'
import { TimelineClip } from "@/types"
import ProgramPlayer from "@/components/Editor/ProgramPlayer"
import { videoService } from '@/utils/videoService';
import { toast } from '@/hooks/use-toast';

export default function VideoEditor() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [fps, setFps] = useState(24)
  const [timelineClips, setTimelineClips] = useState<TimelineClip[]>([])
  const [currentClip, setCurrentClip] = useState<TimelineClip | null>(null)
  const [isPlayingProgram, setIsPlayingProgram] = useState(false)
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewURL) URL.revokeObjectURL(previewURL)
    }
  }, [previewURL])

  // Mute/unmute the preview video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
    }
  }, [isMuted])

  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles(files)
  }

  const handlePreviewSelect = (file: File) => {
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
    setCurrentFile(file)
    const url = URL.createObjectURL(file)
    setPreviewURL(url)
  }

  const handleTimelineClipsChange = (clips: TimelineClip[]) => {
    setTimelineClips(clips)
    const cClip = clips.find(clip => currentTime >= clip.start && currentTime <= clip.end)
    setCurrentClip(cClip || null)
  }

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
    const clipAtTime = timelineClips.find(clip => time >= clip.start && time <= clip.end)
    setCurrentClip(clipAtTime || null)
  }

  const togglePlayPause = () => {
    if (videoRef.current && currentFile?.type.startsWith('video/')) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setFps(24) // Or detect actual fps
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(duration)
  }

  // Use requestAnimationFrame for smoother time updates
  useEffect(() => {
    let rafId: number
    const update = () => {
      if (videoRef.current && !videoRef.current.paused) {
        setCurrentTime(videoRef.current.currentTime)
        rafId = requestAnimationFrame(update)
      }
    }
    if (isPlaying && videoRef.current) {
      rafId = requestAnimationFrame(update)
    }
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isPlaying])

  const handleSeek = (value: number[]) => {
    const percentage = value[0]
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = (percentage / 100) * duration
      if (!isPlaying) {
        setCurrentTime(videoRef.current.currentTime)
      }
    }
  }

  const formatTime = (timeInSeconds: number, fps: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    const frame = Math.floor((timeInSeconds - Math.floor(timeInSeconds)) * fps)
    const mm = String(minutes).padStart(2, '0')
    const ss = String(seconds).padStart(2, '0')
    const ff = String(frame).padStart(2, '0')
    return `${mm}:${ss}:${ff}`
  }

  const toggleProgramPlayPause = () => {
    if (!currentClip || currentClip.asset.type !== 'video') return
    const videoElement = document.getElementById('programVideo') as HTMLVideoElement
    if (!videoElement) return

    if (isPlayingProgram) {
      videoElement.pause()
    } else {
      videoElement.play()
    }
    setIsPlayingProgram(!isPlayingProgram)
  }

  const handleProgramTimeUpdate = () => {
    const videoElement = document.getElementById('programVideo') as HTMLVideoElement
    if (!videoElement) return

    const newTime = (currentClip?.start ?? 0) + videoElement.currentTime
    handleTimeUpdate(newTime)
  }

  const handleExportVideo = async () => {
    if (timelineClips.length === 0) {
      toast({
        title: 'Error',
        description: 'No clips to export',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      const result = await videoService.exportVideo('default', timelineClips, {
        width: 1920,
        height: 1080,
        codec: 'libx264',
        bitrate: '2000k',
        fps: 30
      });

      // Create download link
      const link = document.createElement('a');
      link.href = result.outputPath;
      link.download = 'exported-video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Success',
        description: 'Video exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export video',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="h-screen max-h-screen bg-background p-3 flex gap-3 overflow-hidden">
      {/* Thinner Left Side Navigation */}
      <Card className="w-[60px] p-2 flex flex-col gap-2">
        <Button 
          size="icon"
          variant="ghost"
          onClick={() => router.push('/scriptwriter')}
          title="Generate Script"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button 
          size="icon"
          variant="ghost"
          disabled={selectedFiles.length === 0}
          title="Generate Audio"
        >
          <Music className="h-4 w-4" />
        </Button>
        <Button 
          size="icon"
          variant="ghost"
          disabled={!currentFile?.type.startsWith('video/')}
          title="Remove Silences"
        >
          <Scissors className="h-4 w-4" />
        </Button>
        <Button 
          size="icon"
          variant="ghost"
          disabled={!currentFile?.type.startsWith('video/')}
          title="Add Keyframes"
        >
          <Key className="h-4 w-4" />
        </Button>
        <Button 
          size="icon"
          variant="ghost"
          disabled={selectedFiles.length === 0}
          title="Match Images"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button 
          size="icon"
          variant="ghost"
          disabled={timelineClips.length === 0 || isExporting}
          onClick={handleExportVideo}
          title="Export"
        >
          <Download className="h-4 w-4" />
        </Button>
      </Card>

      {/* Modified Main Content Area */}
      <div className="flex flex-col gap-3 flex-1 h-full overflow-hidden">
        {/* Top half: Split into Import and Properties */}
        <div className="h-[60%]">
          <Tabs defaultValue="import" className="h-full">
            <div className="flex justify-between items-center mb-2">
              <TabsList>
                <TabsTrigger value="import">Import Media</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="import" className="h-[calc(100%-40px)]">
              <ImportMedia
                onFileSelect={handleFilesSelect}
                onPreviewSelect={handlePreviewSelect}
                acceptedFileTypes="video/*,audio/*,image/*"
                maxFileSize={500}
              />
            </TabsContent>

            <TabsContent value="properties" className="h-[calc(100%-40px)]">
              <Card className="h-full p-4">
                {currentClip ? (
                  <div className="space-y-4">
                    {/* Audio Properties */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4" />
                        <h3 className="text-sm font-medium">Audio</h3>
                      </div>
                      <div className="pl-6 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Volume</span>
                          <Slider
                            defaultValue={[100]}
                            max={200}
                            step={1}
                            className="w-[200px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Effects */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <h3 className="text-sm font-medium">Effects</h3>
                      </div>
                      <div className="pl-6">
                        <Button variant="outline" size="sm" className="w-full">
                          Add Effect
                        </Button>
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <h3 className="text-sm font-medium">Settings</h3>
                      </div>
                      <div className="pl-6 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Speed</span>
                          <Slider
                            defaultValue={[100]}
                            max={200}
                            step={1}
                            className="w-[200px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Select a clip to view properties
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom half: Timeline */}
        <Timeline 
          className="h-[40%]"
          projectId="default"
          duration={videoRef.current?.duration || 0}
          onTimeUpdate={handleTimeUpdate}
          onClipsChange={handleTimelineClipsChange}
          currentTime={currentTime}
          selectedClipId={currentClip?.id}
          onClipSelect={(clipId: string | null) => {
            const clip = timelineClips.find(c => c.id === clipId);
            setCurrentClip(clip || null);
          }}
        />
      </div>

      {/* Right side: Preview + Program */}
      <Card className="shrink-0 p-3 flex flex-col h-full overflow-hidden">
        <Tabs defaultValue="preview" className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="program">Program</TabsTrigger>
            </TabsList>
          </div>

          {/* PREVIEW TAB */}
          <TabsContent
            value="preview"
            className="flex justify-between flex-col h-full">
            {/* Media container with constrained height */}
            <div className="h-[650px] w-[366px] relative bg-black rounded-lg overflow-hidden mx-auto">
              {currentFile?.type.startsWith('video/') && previewURL ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  src={previewURL}
                  playsInline
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleEnded}
                />
              ) : currentFile?.type.startsWith('image/') && previewURL ? (
                <img
                  className="w-full h-full object-contain"
                  src={previewURL}
                  alt="Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Preview controls with fixed height */}
            <div className="h-[80px] py-2 flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={togglePlayPause}
                  disabled={!currentFile?.type.startsWith('video/')}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={toggleMute}
                  disabled={!currentFile?.type.startsWith('video/')}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
              {currentFile?.type.startsWith('video/') && duration > 0 && (
                <div className="flex items-center gap-2 w-full">
                  <span className="text-sm text-muted-foreground">
                    {formatTime(currentTime, fps)}
                  </span>
                  <Slider
                    value={duration > 0 ? [(currentTime / duration) * 100] : [0]}
                    max={100}
                    step={0.1}
                    className="flex-1"
                    onValueChange={handleSeek}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formatTime(duration, fps)}
                  </span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* PROGRAM TAB */}
          <TabsContent
            value="program"
            className="flex justify-between flex-col h-full">
            {/* Media container with same styling as preview */}
            <div className="h-[650px] w-[366px] relative bg-black rounded-lg overflow-hidden mx-auto">
              <div className="relative w-full" style={{ paddingTop: '177.78%' }}> {/* 16/9 * 100% = 177.78% */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <ProgramPlayer
                    currentClip={currentClip}
                    autoPlay={false}
                    onTimeUpdate={handleProgramTimeUpdate}
                    isMuted={isMuted}
                  />
                </div>
              </div>
            </div>

            {/* Program controls with fixed height */}
            <div className="h-[80px] py-2 flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={toggleProgramPlayPause}
                  disabled={!currentClip || currentClip.asset.type !== 'video'}
                >
                  {isPlayingProgram ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={toggleMute}
                  disabled={!currentClip || currentClip.asset.type !== 'video'}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
              {currentClip?.asset.type === 'video' && duration > 0 && (
                <div className="flex items-center gap-2 w-full">
                  <span className="text-sm text-muted-foreground">
                    {formatTime(currentTime, fps)}
                  </span>
                  <Slider
                    value={duration > 0 ? [(currentTime / duration) * 100] : [0]}
                    max={100}
                    step={0.1}
                    className="flex-1"
                    onValueChange={handleSeek}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formatTime(duration, fps)}
                  </span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
