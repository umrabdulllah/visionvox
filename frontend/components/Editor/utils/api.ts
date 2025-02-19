import { Project, User } from '../../../types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/projects`);
  return response.json();
}

export async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${id}`);
  return response.json();
} 