
export enum AppView {
  HOME = 'home',
  TUTOR = 'tutor',
  LIBRARY = 'library',
  SOCIAL = 'social',
  PROJECTS = 'projects',
  ADMIN = 'admin',
  LOGIN = 'login',
  REGISTER = 'register',
  PROFILE = 'profile',
  SETTINGS = 'settings',
  NOTIFICATIONS = 'notifications'
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
  studentId?: string;
  isIdVisible?: boolean;
  isEmailVisible?: boolean;
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
  authorStudentId?: string;
  authorEmail?: string;
  authorIsIdVisible?: boolean;
  authorIsEmailVisible?: boolean;
  likedBy?: string[];
}

export interface Project {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_avatar: string;
  ownerName: string; // Compatibility
  ownerAvatar: string; // Compatibility
  title: string;
  description: string;
  trimester: string;
  year: string;
  status: 'Open' | 'In Progress' | 'Completed';
  tags: string[];
  looking_for?: string[];
  lookingFor?: string[]; // Compatibility
  members_needed: number;
  membersNeeded?: number; // Compatibility
  memberCount?: number;
  percentage?: number;
  createdAt: string;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  student_id?: string;
  role: 'Leader' | 'Contributor' | 'Reviewer' | 'Dev' | 'Designer' | 'Researcher';
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo?: string; // Legacy single user ID
  assigned_to?: string; // Backend compatibility
  assignedName?: string; // Legacy
  assignedAvatar?: string; // Legacy
  assignees?: { id: string; name: string; avatar: string }[]; // New: support for multiple assignees
  status: 'Todo' | 'Done';
  dueDate?: string;
  createdAt?: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  content: string;
  updatedAt: string;
  isAiSynthesized: boolean;
}

export interface Resource {
  id: string;
  title: string;
  type: 'Note' | 'Slide' | 'Question Bank';
  department: string;
  trimester: string;
  year: string;
  faculty: string;
  subject: string;
  file_path: string;
  text_content?: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
