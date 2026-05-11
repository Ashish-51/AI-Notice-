import { Timestamp } from 'firebase/firestore';

export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  institution?: string;
  department?: string;
  semester?: string;
  staffId?: string;
  createdAt: Timestamp;
}

export type NoticeCategory = 
  | 'Academics' 
  | 'Events & Activities' 
  | 'Career & Placements' 
  | 'Holidays & Leave' 
  | 'General';

export type AudienceType = 
  | 'Everyone' 
  | 'Entire Faculty' 
  | 'Specific Course' 
  | 'Specific Semester';

export type NoticePriority = 'Normal' | 'Important' | 'Urgent';

export interface Notice {
  id: string;
  title: string;
  description: string;
  summary?: string;
  simplified?: string;
  category: NoticeCategory;
  audienceType: AudienceType;
  faculty: string;
  department?: string;
  semester?: string;
  priority: NoticePriority;
  expiryDate?: Timestamp;
  formLink?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  extractedText?: string;
  isPinned?: boolean;
  authorId: string;
  authorName: string;
  uploadedBy?: string;
  uploaderRole?: string;
  visibilityScope?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
