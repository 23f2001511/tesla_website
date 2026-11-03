import type { Types } from 'mongoose';

/**
 * What `.lean()` returns for every collection: the schema fields plus the
 * generated `_id` and timestamps. Typing these once lets every route/page use
 * `.lean<IUser[]>()` instead of `any`, so fields stay checked end to end.
 */
export interface LeanDoc {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserRole =
  | 'Admin'
  | 'PI'
  | 'President'
  | 'OfficeBearer'
  | 'TeamLeader'
  | 'TeamMember'
  | 'Alumni';

export interface IUserAchievement {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  year?: string;
  category?: string;
  teamMembers?: string[];
  eventLink?: string;
  coverImage?: string;
  isFeatured?: boolean;
}

export interface IUserProject {
  title: string;
  description?: string;
  github?: string;
  demo?: string;
}

export interface IUser extends LeanDoc {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  team?: string;
  designation?: string;
  permissions?: string[];
  rollNo?: string;
  rollNumber?: string;
  branch?: string;
  year?: string;
  batch?: number;
  company?: string;
  currentRole?: string;
  graduationYear?: number;
  location?: string;
  bio?: string;
  profileImage?: string;
  portfolio?: string;
  resume?: string;
  phone?: string;
  availability?: string;
  currentSemester?: number;
  cgpa?: string;
  skills?: string[];
  interests?: string[];
  languages?: string[];
  preferredDomains?: string[];
  achievements?: IUserAchievement[];
  projects?: IUserProject[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    instagram?: string;
    twitter?: string;
  };
  isPublic?: boolean;
  status?: 'active' | 'inactive' | 'alumni';
  isVerified?: boolean;
  mustChangePassword?: boolean;
  preferences?: {
    emailNotifications?: boolean;
    theme?: string;
    coverBanner?: string;
    openToCollaboration?: boolean;
  };
}

export interface ITeam extends LeanDoc {
  name: string;
  description?: string;
  coverImage?: string;
  lead?: Types.ObjectId | string | IUser | null;
  members?: (Types.ObjectId | string | IUser)[];
  isActive?: boolean;
  createdBy?: Types.ObjectId | string | null;
}

export interface IEvent extends LeanDoc {
  title: string;
  description: string;
  date: Date | string;
  venue: string;
  speaker?: string;
  poster?: string;
  category: string;
  seatLimit?: number;
  isFeatured?: boolean;
  registeredUsers?: (Types.ObjectId | string)[];
  waitlist?: (Types.ObjectId | string)[];
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  requestedBy?: Types.ObjectId | string | null;
  requestNote?: string;
  adminRemarks?: string;
  submittedAt?: Date | null;
}

export interface IBlog extends LeanDoc {
  title: string;
  content: string;
  author?: Types.ObjectId | string | IUser;
  category: string;
  coverImage?: string;
  isFeatured?: boolean;
  status?: 'Draft' | 'Pending' | 'Published' | 'Rejected';
  likes?: (Types.ObjectId | string)[];
  views?: number;
  tags?: string[];
}

export interface IAchievement extends LeanDoc {
  title: string;
  description: string;
  category: string;
  teamMembers?: string[];
  coverImage?: string;
  gallery?: string[];
  venue?: string;
  achievementDate: Date | string;
  organizer?: string;
  tags?: string[];
  eventLink?: string;
  isFeatured?: boolean;
  status?: 'Pending' | 'Published' | 'Rejected';
  uploadedBy?: Types.ObjectId | string | IUser;
  uploaderName?: string;
}

export interface IGallery extends LeanDoc {
  title: string;
  imageUrl: string;
  mediaUrl?: string;
  album: string;
  caption?: string;
  mediaType?: 'Photo' | 'Video';
  uploadSource?: 'Direct' | 'GoogleDrive';
  views?: number;
}

export interface IResourceFile {
  _id?: Types.ObjectId;
  title: string;
  fileUrl: string;
  type: 'Note' | 'PYQ';
  views?: number;
  downloads?: number;
  uploadedBy?: Types.ObjectId | string;
}

export interface IResource extends LeanDoc {
  department: string;
  semester: number;
  subjectName: string;
  subjectCode?: string;
  files?: IResourceFile[];
}

export interface ITeamProject extends LeanDoc {
  title: string;
  description?: string;
  team: string;
  status?: 'Planning' | 'In Progress' | 'Review' | 'Completed' | 'Paused';
  membersInvolved?: (Types.ObjectId | string)[];
  createdBy?: Types.ObjectId | string;
}

export interface IVisit extends LeanDoc {
  path?: string;
}

/**
 * `populate()` only embeds the projected fields, so populated refs are modelled
 * separately from the raw ObjectId columns above.
 */
export interface PopulatedUserRef {
  _id?: Types.ObjectId;
  name?: string;
  email?: string;
  profileImage?: string;
  team?: string;
  role?: UserRole;
  designation?: string;
  status?: string;
}

export type ITeamPopulated = Omit<ITeam, 'lead'> & { lead?: PopulatedUserRef | null };
export type IBlogPopulated = Omit<IBlog, 'author'> & { author?: PopulatedUserRef | null };

/** Directory projection shared by the dashboard analytics queries. */
export type UserDirectoryRow = Pick<
  IUser,
  'name' | 'role' | 'designation' | 'team' | 'status' | 'profileImage' | 'createdAt'
> &
  LeanDoc;

