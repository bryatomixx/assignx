import type {
  Post,
  Comment,
  Like,
  Follow,
  CommunitySettings,
  ModPermissions,
  AppNotification,
} from "@/lib/types";

// NOTE: All seed dates are ISO literals, no Date.now() or new Date() calls.

export const SEED_COMMUNITY_SETTINGS: CommunitySettings = {
  globalApproval: true,
  autoApproveUserIds: ["u-michelle"], // Michelle is trusted; her posts skip the queue
};

// Jon is a Mod with limited permissions (cannot delete posts or manage approval settings)
export const SEED_MODS: Record<string, ModPermissions> = {
  "u-jon": {
    canApprovePosts: true,
    canDeletePosts: false,
    canDeleteComments: true,
    canPinContent: true,
    canManageApproval: false,
  },
};

export const SEED_POSTS: Post[] = [
  {
    id: "post-1",
    authorId: "u-admin",
    body: "Welcome to the AssignX Community Board! Share wins, ask questions, and support each other on the 30-day journey.",
    mediaType: "link",
    mediaPayload: "https://www.assignx.ai",
    status: "approved",
    pinned: true,
    createdAt: "2026-05-01T09:00:00.000Z",
    // Admin's own welcome post; approvedBy self is reasonable but null is also valid
    approvedBy: "u-admin",
    approvedAt: "2026-05-01T09:00:00.000Z",
    rejectedBy: null,
    rejectedAt: null,
  },
  {
    id: "post-2",
    authorId: "u-michelle",
    body: "Just finished Week 1: the whitelabel setup was smoother than I expected. Loving the platform so far!",
    mediaType: "text",
    mediaPayload: null,
    status: "approved",
    pinned: false,
    createdAt: "2026-05-10T14:22:00.000Z",
    // Michelle is in autoApproveUserIds; admin retroactively credited as approver
    approvedBy: "u-admin",
    approvedAt: "2026-05-10T14:22:00.000Z",
    rejectedBy: null,
    rejectedAt: null,
  },
  {
    id: "post-3",
    authorId: "u-jon",
    body: "Had my first agency prospecting call today using the AI agent. It booked two appointments on its own. Screenshot below.",
    mediaType: "image",
    mediaPayload: null, // image upload via Supabase Storage coming later
    status: "approved",
    pinned: false,
    createdAt: "2026-05-15T10:45:00.000Z",
    // Jon is a Mod; auto-approved; admin credited
    approvedBy: "u-admin",
    approvedAt: "2026-05-15T10:45:00.000Z",
    rejectedBy: null,
    rejectedAt: null,
  },
  {
    id: "post-4",
    authorId: "u-test",
    body: "Does anyone have experience connecting Twilio to a GHL sub-account? My A2P approval is taking forever.",
    mediaType: "text",
    mediaPayload: null,
    status: "approved",
    pinned: false,
    createdAt: "2026-05-20T08:30:00.000Z",
    approvedBy: "u-admin",
    approvedAt: "2026-05-20T08:35:00.000Z",
    rejectedBy: null,
    rejectedAt: null,
  },
  {
    id: "post-5",
    authorId: "u-stevie",
    body: "Hey everyone! Just joined. Excited to start the challenge. Any tips for someone just getting into the agency space?",
    mediaType: "text",
    mediaPayload: null,
    status: "pending", // pending, keeps the moderation queue non-empty for demo
    pinned: false,
    createdAt: "2026-06-01T17:05:00.000Z",
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
  },
  // Recent approved posts so the "This week" leaderboard has data (week of 2026-06-15)
  {
    id: "post-6",
    authorId: "u-jon",
    body: "Week 6 update: just landed my second retainer client using the outreach sequence from Module 4. The AI follow-up cadence is a game changer.",
    mediaType: "text",
    mediaPayload: null,
    status: "approved",
    pinned: false,
    createdAt: "2026-06-13T11:00:00.000Z",
    approvedBy: "u-admin",
    approvedAt: "2026-06-13T11:05:00.000Z",
    rejectedBy: null,
    rejectedAt: null,
  },
  {
    id: "post-7",
    authorId: "u-michelle",
    body: "Sharing my onboarding checklist for new GHL sub-accounts. Cut my setup time in half. Happy to answer questions!",
    mediaType: "link",
    mediaPayload: "https://docs.google.com/spreadsheets/d/example",
    status: "approved",
    pinned: false,
    createdAt: "2026-06-14T09:30:00.000Z",
    approvedBy: "u-admin",
    approvedAt: "2026-06-14T09:32:00.000Z",
    rejectedBy: null,
    rejectedAt: null,
  },
];

export const SEED_COMMENTS: Comment[] = [
  {
    id: "comment-1",
    postId: "post-2",
    authorId: "u-admin",
    body: "Great to hear, Michelle! Keep that momentum going into Week 2.",
    pinned: true, // pinned so the admin response is always visible
    createdAt: "2026-05-10T15:00:00.000Z",
  },
  {
    id: "comment-2",
    postId: "post-2",
    authorId: "u-jon",
    body: "Same experience here. The domain config tutorial in the resource hub was a lifesaver.",
    pinned: false,
    createdAt: "2026-05-10T16:10:00.000Z",
  },
  {
    id: "comment-3",
    postId: "post-3",
    authorId: "u-michelle",
    body: "This is amazing, Jon! Which niche are you targeting?",
    pinned: false,
    createdAt: "2026-05-15T11:30:00.000Z",
  },
  {
    id: "comment-4",
    postId: "post-4",
    authorId: "u-jon",
    body: "A2P took about 5 business days for me. Make sure your Trust Hub business profile is 100% complete before submitting.",
    pinned: false,
    createdAt: "2026-05-20T09:45:00.000Z",
  },
  // Recent comments (week of 2026-06-15) to populate the weekly leaderboard
  {
    id: "comment-5",
    postId: "post-6",
    authorId: "u-michelle",
    body: "Congrats Jon! Which outreach channel converted best for you - email or SMS?",
    pinned: false,
    createdAt: "2026-06-13T12:15:00.000Z",
  },
  {
    id: "comment-6",
    postId: "post-6",
    authorId: "u-test",
    body: "This is inspiring. I am starting Module 4 today after seeing this.",
    pinned: false,
    createdAt: "2026-06-13T13:40:00.000Z",
  },
  {
    id: "comment-7",
    postId: "post-7",
    authorId: "u-jon",
    body: "Michelle this is gold. Bookmarked. Any chance you cover the A2P registration step in there?",
    pinned: false,
    createdAt: "2026-06-14T10:05:00.000Z",
  },
];

export const SEED_LIKES: Like[] = [
  { userId: "u-test", postId: "post-1" },
  { userId: "u-jon", postId: "post-1" },
  { userId: "u-michelle", postId: "post-1" },
  { userId: "u-stevie", postId: "post-1" },
  { userId: "u-admin", postId: "post-2" },
  { userId: "u-jon", postId: "post-2" },
  { userId: "u-test", postId: "post-2" },
  { userId: "u-michelle", postId: "post-3" },
  { userId: "u-admin", postId: "post-3" },
  { userId: "u-test", postId: "post-4" },
];

export const SEED_FOLLOWS: Follow[] = [
  { followerId: "u-test", followeeId: "u-admin" },
  { followerId: "u-test", followeeId: "u-michelle" },
  { followerId: "u-jon", followeeId: "u-admin" },
  { followerId: "u-jon", followeeId: "u-michelle" },
  { followerId: "u-michelle", followeeId: "u-admin" },
  { followerId: "u-stevie", followeeId: "u-admin" },
  { followerId: "u-stevie", followeeId: "u-michelle" },
];

// Demo notifications for u-test so the bell badge shows something on first load.
// Seeds use ISO literals; never call new Date() here.
export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    recipientId: "u-test",
    actorId: "u-michelle",
    type: "like",
    postId: "post-4", // Michelle liked u-test's Twilio post
    createdAt: "2026-05-21T10:00:00.000Z",
    read: false,
  },
  {
    id: "notif-2",
    recipientId: "u-test",
    actorId: "u-jon",
    type: "comment",
    postId: "post-4", // Jon commented on u-test's Twilio post
    createdAt: "2026-05-20T09:45:00.000Z",
    read: false,
  },
  {
    id: "notif-3",
    recipientId: "u-test",
    actorId: "u-stevie",
    type: "follow",
    postId: null, // Stevie followed u-test
    createdAt: "2026-06-01T18:00:00.000Z",
    read: false,
  },
];
