import { TimelineClip } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500/api';

export const videoService = {
  async trimVideo(projectId: string, videoPath: string, startTime: number, endTime: number) {
    const response = await fetch(`${API_URL}/projects/${projectId}/video/trim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoPath,
        startTime,
        endTime,
        outputFileName: `trim-${Date.now()}.mp4`
      })
    });
    return response.json();
  },

  async mergeVideos(projectId: string, videos: { path: string }[]) {
    const response = await fetch(`${API_URL}/projects/${projectId}/video/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videos,
        outputFileName: `merge-${Date.now()}.mp4`
      })
    });
    return response.json();
  },

  async generateThumbnail(projectId: string, videoPath: string, time: number) {
    const response = await fetch(`${API_URL}/projects/${projectId}/video/thumbnail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoPath,
        time,
        outputFileName: `thumb-${Date.now()}.jpg`
      })
    });
    return response.json();
  },

  async generatePreview(projectId: string, videoPath: string) {
    const response = await fetch(`${API_URL}/projects/${projectId}/video/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoPath,
        outputFileName: `preview-${Date.now()}.mp4`
      })
    });
    return response.json();
  },

  async exportVideo(projectId: string, clips: TimelineClip[], settings: {
    width: number;
    height: number;
    codec?: string;
    bitrate?: string;
    fps?: number;
  }) {
    const response = await fetch(`${API_URL}/projects/${projectId}/video/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clips,
        settings,
        outputFileName: `export-${Date.now()}.mp4`
      })
    });
    return response.json();
  }
}; 