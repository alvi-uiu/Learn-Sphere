
export enum AppView {
  HOME = 'home',
  TUTOR = 'tutor',
  LIBRARY = 'library',
  SOCIAL = 'social',
  PROJECTS = 'projects',
  ADMIN = 'admin',
  LOGIN = 'login',
  REGISTER = 'register',
  PROFILE = 'profile'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'professor' | 'admin';
  avatar: string;
  major?: string;
  bio?: string;
  xp: number;
}

export interface SessionData {
  course_name?: string;
  topics?: string;
  start_time?: string;
  meeting_link?: string;
}

export interface Attachment {
  id: string;
  file_path: string;
  file_name: string;
  file_type: 'photo' | 'doc';
}

export interface Post {
  id: string;
  author: string;
  authorId: string;
  avatar: string;
  content: string;
  category: string;
  likes: number;
  comments: number;
  timestamp: string;
  image?: string;
  tags?: string[];
  sessionData?: SessionData;
  attachments?: Attachment[];
  isSaved?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  avatar: string;
  tags: string[];
  lookingFor: string[];
  likes: number;
  comments: number;
  status: 'Open' | 'In Progress' | 'Completed';
  timestamp: string;
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  content: string;
  updatedAt: string;
  isAiSynthesized: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
