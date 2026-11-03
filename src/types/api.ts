/**
 * Response DTOs shared between API routes and the client pages that consume
 * them. Dates are ISO strings here because everything crosses the JSON
 * boundary; `ObjectId`s are always serialised to strings server-side.
 */

export interface SeriesPoint {
  label: string;
  count: number;
}

// ─── Member dashboard (/api/dashboard/members) ────────────────────────────────

/** One row of the member dashboard activity timeline. */
export interface MemberTimelineItem {
  action: string;
  time: string;
  type: string;
  color: string;
  ts: number;
}

/** Only the blog fields the member dashboard renders. */
export interface MemberBlogItem {
  _id: string;
  title: string;
  category?: string;
  views?: number;
  createdAt: string;
}

/** Only the event fields the member dashboard renders. */
export interface MemberEventItem {
  _id: string;
  title: string;
  date: string;
}

/** Payload returned by GET /api/dashboard/members. */
export interface MemberDashboardData {
  success: boolean;
  user: MemberDTO;
  stats: {
    blogsWritten: number;
    approvedEvents: number;
    resourcesUploaded: number;
    achievementsCount: number;
    skillsCount: number;
    profileViews: number;
  };
  timeline: MemberTimelineItem[];
  blogs: MemberBlogItem[];
  events: MemberEventItem[];
}

// ─── Public events ───────────────────────────────────────────────────────────

/**
 * An event as returned by the public `GET /api/events` feed (see
 * `src/app/api/events/route.ts`). Only the fields the public cards render are
 * declared; everything else on the document is ignored.
 */
export interface PublicEventDTO {
  id: string;
  title: string;
  date: string;
  description?: string;
  venue?: string;
  speaker?: string;
  poster?: string;
  category?: string;
  isFeatured?: boolean;
}

// ─── Members & teams ─────────────────────────────────────────────────────────

/** An achievement entry embedded on a user document (JSON-safe). */
export interface MemberAchievementDTO {
  _id?: string;
  title: string;
  description?: string;
  year?: string;
  category?: string;
  teamMembers?: string[];
  eventLink?: string;
  coverImage?: string;
  isFeatured?: boolean;
}

/** A project entry embedded on a user document (JSON-safe). */
export interface MemberProjectDTO {
  title: string;
  description?: string;
  github?: string;
  demo?: string;
}

/**
 * A user document as it crosses the wire — `IUser` with `ObjectId`/`Date`
 * fields already serialised by NextResponse.json.
 */
export interface MemberDTO {
  _id: string;
  name: string;
  email: string;
  role: string;
  team?: string;
  designation?: string;
  permissions?: string[];
  rollNo?: string;
  rollNumber?: string;
  branch?: string;
  year?: string;
  batch?: number;
  graduationYear?: number;
  company?: string;
  currentRole?: string;
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
  achievements?: MemberAchievementDTO[];
  projects?: MemberProjectDTO[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    instagram?: string;
    twitter?: string;
  };
  isPublic?: boolean;
  status?: string;
  isVerified?: boolean;
  mustChangePassword?: boolean;
  preferences?: {
    emailNotifications?: boolean;
    theme?: string;
    coverBanner?: string;
    openToCollaboration?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

/** Lead reference embedded in a serialised team. */
export interface TeamLeadRef {
  _id: string;
  name: string;
  email: string;
  profileImage: string;
}

/**
 * A team plus its roll-up stats, as returned by `/api/admin/teams`
 * (see `serializeTeam` in that route).
 */
export interface AdminTeamDTO {
  _id: string;
  name: string;
  description: string;
  coverImage: string;
  isActive: boolean;
  createdAt?: string;
  lead: TeamLeadRef | null;
  totalMembers: number;
  activeMembers: number;
  blogs: number;
  events: number;
  resources: number;
}

// ─── Team-leader workspace (/api/dashboard/team) ──────────────────────────────

/** The signed-in team leader, as embedded in the workspace payload. */
export interface TeamWorkspaceLeader {
  _id: string;
  name: string;
  role: string;
  designation?: string;
  permissions: string[];
}

/** One row of the "recent activity" list, derived from team members' blogs. */
export interface TeamActivityItem {
  action: string;
  time: string;
  type: string;
}

/** One row of the "upcoming schedule" list, derived from club events. */
export interface TeamUpcomingEvent {
  title: string;
  date: string;
  time: string;
  location: string;
  tag: string;
}

/** Payload returned by GET /api/dashboard/team. */
export interface TeamWorkspaceData {
  success: boolean;
  team: string;
  leader: TeamWorkspaceLeader;
  members: MemberDTO[];
  count: number;
  recentActivity: TeamActivityItem[];
  upcomingEvents: TeamUpcomingEvent[];
}

export interface PiEventInsight {
  _id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  speaker: string;
  category: string;
  poster: string;
  registrations: number;
  status: string;
}

export interface PiBlogInsight {
  _id: string;
  title: string;
  excerpt: string;
  category: string;
  coverImage: string;
  views: number;
  likes: number;
  tags: string[];
  author: string;
  authorImage: string;
  createdAt: string;
}

export interface PiAchievementInsight {
  _id: string;
  title: string;
  description: string;
  category: string;
  coverImage: string;
  gallery: string[];
  venue: string;
  achievementDate: string;
  organizer: string;
  tags: string[];
  eventLink: string;
  teamMembers: string[];
  createdAt: string;
}

export interface PiTeamMember {
  _id: string;
  name: string;
  profileImage: string;
  role: string;
  designation: string;
}

export interface PiTeamInsight {
  _id: string;
  name: string;
  description: string;
  coverImage: string;
  isActive: boolean;
  createdAt: string;
  lead: { name: string; email: string; profileImage: string } | null;
  memberCount: number;
  activeMembers: number;
  blogs: number;
  events: number;
  resources: number;
  lastActivity: string | null;
  members: PiTeamMember[];
}

export interface PiActivityItem {
  type: string;
  text: string;
  at: string;
}

export interface PiKpis {
  totalMembers: number;
  activeMembers: number;
  totalTeams: number;
  activeTeams: number;
  totalEvents: number;
  publishedBlogs: number;
  totalAchievements: number;
  alumniCount: number;
  newMembers30d: number;
  events30d: number;
  blogs30d: number;
  achievements30d: number;
}

/** Payload returned by GET /api/dashboard/pi (see src/app/api/dashboard/pi/route.ts). */
export interface PiDashboardData {
  success: boolean;
  period: string;
  kpis: PiKpis;
  series: {
    events: SeriesPoint[];
    blogs: SeriesPoint[];
    achievements: SeriesPoint[];
    members: SeriesPoint[];
  };
  teams: PiTeamInsight[];
  activity: PiActivityItem[];
  events: {
    total: number;
    upcoming: number;
    completed: number;
    recent: PiEventInsight[];
    upcomingList: PiEventInsight[];
    topByRegistrations: PiEventInsight[];
  };
  blogs: {
    totalPublished: number;
    recent: PiBlogInsight[];
    topViewed: PiBlogInsight[];
    topLiked: PiBlogInsight[];
  };
  achievements: {
    total: number;
    categories: { name: string; count: number }[];
    recent: PiAchievementInsight[];
  };
  visibility: {
    blogViews: number;
    blogLikes: number;
    eventRegistrations: number;
    resourceViews: number;
    resourceDownloads: number;
    visitsTotal: number;
    visits30d: number;
    visitsTrend: SeriesPoint[];
  };
}
