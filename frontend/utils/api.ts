import { Project, User, Script } from '../types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500/api';

// Helper function to get auth header
const getAuthHeader = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function for API calls with better error handling
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers || {})
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`
      }));

      // Handle specific error cases
      if (response.status === 401) {
        localStorage.removeItem('token'); // Clear invalid token
        window.location.href = '/login'; // Redirect to login
        throw new Error('Session expired. Please login again.');
      }

      if (response.status === 400) {
        throw new Error(errorData.error || errorData.message || 'Bad request');
      }

      throw new Error(errorData.error || errorData.message || 'API call failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

// Auth APIs
export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const data = await apiCall<{ user: User; token: string }>('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('token', data.token);
  return data;
}

export async function signup(userData: {
  email: string;
  password: string;
  username: string;
}): Promise<{ user: User; token: string }> {
  const data = await apiCall<{ user: User; token: string }>('/users/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  localStorage.setItem('token', data.token);
  return data;
}

export async function logout(): Promise<void> {
  await apiCall('/users/logout', {
    method: 'POST',
  });
  localStorage.removeItem('token');
}

// User APIs
export async function getUserProfile(): Promise<User> {
  return apiCall<User>('/users/profile');
}

export async function updateUserProfile(data: Partial<User>): Promise<User> {
  return apiCall<User>('/users/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Project APIs
export async function getProjects(): Promise<Project[]> {
  return apiCall<Project[]>('/projects');
}

export async function getProject(id: string): Promise<Project> {
  return apiCall<Project>(`/projects/${id}`);
}

export async function createProject(data: { 
  name: string; 
  description?: string;
  projectType: 'video' | 'script' | 'both';
}): Promise<Project> {
  return apiCall<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  return apiCall<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<{ message: string }> {
  return apiCall<{ message: string }>(`/projects/${id}`, {
    method: 'DELETE',
  });
}

// Script APIs
export async function getProjectScripts(projectId: string): Promise<Script[]> {
  return apiCall<Script[]>(`/scripts/${projectId}`);
}

export async function createScript(projectId: string, data: { title: string; generatedScript: string }): Promise<Script> {
  return apiCall<Script>(`/scripts/${projectId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateScript(projectId: string, scriptId: string, data: Partial<Script>): Promise<Script> {
  return apiCall<Script>(`/projects/${projectId}/scripts/${scriptId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteScript(projectId: string, scriptId: string): Promise<void> {
  return apiCall(`/scripts/${projectId}/scripts/${scriptId}`, {
    method: 'DELETE',
  });
}

// Admin APIs
export async function getUserAnalytics(): Promise<{
  userId: string;
  username: string;
  email: string;
  lastActive: string;
  timeSpent: number;
  pageVisits: {
    page: string;
    timeSpent: number;
    lastVisit: string;
  }[];
}[]> {
  return apiCall('/analytics/users');
} 