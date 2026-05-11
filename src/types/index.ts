import { Timestamp } from 'firebase/firestore';

export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  institution?: string;
  department?: string;
  staffId?: string;
  createdAt: Timestamp;
}

export type NoticeCategory = 
  | 'Assignment' 
  | 'Event' 
  | 'Exam' 
  | 'Workshop' 
  | 'Holiday' 
  | 'Placement' 
  | 'Urgent' 
  | 'Circular' 
  | 'Competition' 
  | 'Seminar' 
  | 'Club Activity' 
  | 'Other';
export type NoticePriority = 'Normal' | 'Important' | 'Urgent';

export interface Notice {
  id: string;
  title: string;
  description: string;
  summary?: string;
  simplified?: string;
  category: NoticeCategory;
  priority: NoticePriority;
  expiryDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  authorId: string;
  authorName: string;
  isPinned: boolean;
  attachmentUrl?: string;
  formLink?: string;
  viewCount: number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}
