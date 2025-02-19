export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin?: boolean;
  projects?: Project[];
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  userId: string;
  projectType: 'video' | 'script' | 'both';
  scripts?: Script[];
  videoFile?: {
    url: string;
    filename: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Script {
  _id: string;
  projectId: string;
  title: string;
  generatedScript: string;
  suggestedVisuals?: {
    visualName: string;
    relatedText: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface TimelineClip {
  id: string;
  asset: {
    url: string;
    type: 'video' | 'image' | 'audio';
    duration?: number;
    name?: string;
  };
  start: number;
  end: number;
  trackIndex: number;
} 