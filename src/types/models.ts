export type DemoRole = 'owner' | 'visitor';

export type Gender = 0 | 1 | 2;

export type ContentType = 'text';

export type SenderType = 'Visitor' | 'IceMan' | 'Host' | 'System';

export type ConversationStatus =
  | 'host_takeover'
  | 'ai_chatting'
  | 'filtered_folded'
  | 'filtered_blocked';

export type IntentType =
  | 'BENIGN_INTERACTION'
  | 'INAPPROPRIATE_REQUEST'
  | 'PRIVACY_SENSITIVE'
  | 'GENERAL_INQUIRY';

export type UserProfile = {
  open_id: string;
  nickName: string;
  avatarUrl: string;
  gender: Gender;
  city: string;
  province?: string;
  country?: string;
  role?: 'host' | 'visitor';
  interests?: string[];
  bio?: string;
  iceman_nickname?: string;
};

export type PersonaTemplate = {
  template_id: string;
  name: string;
  description: string;
  example_dialogue: string;
};

export type IcemanConfig = {
  iceman_id: string;
  owner_user_id: string;
  nickname: string;
  status: 'init' | 'enabled' | 'disabled';
  persona_template_id: string;
  persona_name: string;
};

export type MessageItem = {
  message_id: string;
  sender_type: SenderType;
  sender_id: string;
  sender_name: string;
  content: string;
  content_type: ContentType;
  timestamp: number;
};

export type ConversationPreview = {
  content_brief: string;
  timestamp: number;
};

export type ConversationItem = {
  session_id: string;
  conversation_type: 'host_visitor' | 'owner_im';
  peer_user: UserProfile;
  owner_id: string;
  iceman_id: string;
  status: ConversationStatus;
  is_folded: boolean;
  unread_count: number;
  last_message: ConversationPreview;
  visitor_interest_tags: string[];
  filter_reason: string;
  created_at: number;
  last_message_at: number;
  takeover_at: number | null;
  is_owner_session?: boolean;
};

export type SummaryHighlight = {
  visitor_id: string;
  nickName: string;
  tags: string[];
  session_id: string;
  status: ConversationStatus;
};

export type SummaryCard = {
  summary_id: string;
  owner_user_id: string;
  date: string;
  visitor_count: number;
  content: string;
  visitor_highlights: SummaryHighlight[];
  deeplink: string;
  generated_at: number;
  pushed_at?: number;
};

export type PotentialConnection = {
  is_potential: boolean;
  reason: string;
};
