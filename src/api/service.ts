import { requestApi } from './client';
import type {
  ConversationItem,
  ConversationStatus,
  DemoRole,
  Gender,
  IcemanConfig,
  MessageItem,
  PersonaTemplate,
  SenderType,
  SummaryCard,
  SummaryHighlight,
  UserProfile,
} from '../types/models';

type UpdateConfigPayload = {
  action: 'enable' | 'disable' | 'update';
  nickname?: string;
  persona_template_id?: string;
};

type SendMessagePayload = {
  content: string;
  content_type: 'text';
};

type SendMessageResult = {
  message_id: string;
  timestamp: number;
  ai_reply: MessageItem | null;
  session_status: ConversationStatus;
};

type HostDialogueSendResult = {
  message_id: string;
  timestamp: number;
  ai_reply: MessageItem | null;
};

type TakeoverResult = {
  session_id: string;
  takeover_at: number;
  status: ConversationStatus;
  system_message: string;
};

const DEFAULT_TIMESTAMP = Math.floor(new Date('2026-04-07T00:00:00Z').getTime() / 1000);

export const OWNER_USER_ID = 'owner_user_123';
export const DEFAULT_VISITOR_USER_ID = 'visitor_user_456';
export const DEMO_VISITOR_IDS = [
  'visitor_user_456',
  'visitor_user_789',
  'visitor_user_202',
  'visitor_user_303',
  'visitor_user_101',
] as const;
export const DEFAULT_ICEMAN_AVATAR = '/ice_bb.png';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed) {
        return trimmed;
      }
    }
  }

  return '';
}

function pickNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function pickBoolean(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return false;
}

function pickStringArray(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  }

  return [] as string[];
}

function extractList(payload: unknown, keys: string[]) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const raw = asRecord(payload);

  for (const key of keys) {
    if (Array.isArray(raw[key])) {
      return raw[key] as unknown[];
    }
  }

  return [];
}

function normalizeGender(value: unknown): Gender {
  const gender = pickNumber(value);

  if (gender === 1 || gender === 2) {
    return gender;
  }

  return 0;
}

function normalizeSenderType(value: unknown): SenderType {
  const senderType = pickString(value);

  if (
    senderType === 'Visitor' ||
    senderType === 'IceMan' ||
    senderType === 'Host' ||
    senderType === 'System'
  ) {
    return senderType;
  }

  return 'System';
}

function normalizeConversationStatus(value: unknown): ConversationStatus {
  const status = pickString(value);

  if (
    status === 'host_takeover' ||
    status === 'ai_chatting' ||
    status === 'filtered_folded' ||
    status === 'filtered_blocked'
  ) {
    return status;
  }

  return 'ai_chatting';
}

function buildFallbackUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    open_id: overrides.open_id ?? '',
    nickName: overrides.nickName ?? '未命名用户',
    avatarUrl: overrides.avatarUrl ?? '',
    gender: overrides.gender ?? 0,
    city: overrides.city ?? '',
    province: overrides.province,
    country: overrides.country,
    role: overrides.role,
    interests: overrides.interests ?? [],
    bio: overrides.bio,
    iceman_nickname: overrides.iceman_nickname,
  };
}

function normalizeUser(value: unknown, fallback: Partial<UserProfile> = {}): UserProfile {
  const raw = asRecord(value);

  return {
    open_id: pickString(raw.open_id, fallback.open_id),
    nickName: pickString(raw.nickName, raw.nickname, fallback.nickName, '未命名用户'),
    avatarUrl: pickString(raw.avatarUrl, raw.avatar_url, fallback.avatarUrl),
    gender: normalizeGender(raw.gender ?? fallback.gender),
    city: pickString(raw.city, fallback.city),
    province: pickString(raw.province, fallback.province) || undefined,
    country: pickString(raw.country, fallback.country) || undefined,
    role:
      raw.role === 'host' || raw.role === 'visitor'
        ? raw.role
        : fallback.role,
    interests: pickStringArray(raw.interests, fallback.interests),
    bio: pickString(raw.bio, fallback.bio) || undefined,
    iceman_nickname: pickString(raw.iceman_nickname, fallback.iceman_nickname) || undefined,
  };
}

function normalizeConfig(value: unknown): IcemanConfig {
  const raw = asRecord(value);
  const persona = asRecord(raw.persona);
  const status = pickString(raw.status, raw.state);
  const enabled = raw.enabled;

  return {
    iceman_id: pickString(raw.iceman_id, raw.icemanId, 'iceman_demo'),
    owner_user_id: pickString(raw.owner_user_id, raw.owner_id, OWNER_USER_ID),
    nickname: pickString(raw.nickname, raw.nickName, raw.name, '小冰人'),
    avatarUrl: pickString(raw.avatarUrl, raw.avatar_url, DEFAULT_ICEMAN_AVATAR),
    status:
      status === 'enabled' || status === 'disabled' || status === 'init'
        ? status
        : enabled === true
          ? 'enabled'
          : enabled === false
            ? 'disabled'
            : 'init',
    persona_template_id: pickString(raw.persona_template_id, persona.template_id),
    persona_name: pickString(raw.persona_name, persona.name, '默认人设'),
    opening_msg: pickString(raw.opening_msg) || undefined,
  };
}

function normalizePersonaTemplate(value: unknown): PersonaTemplate {
  const raw = asRecord(value);

  return {
    template_id: pickString(raw.template_id),
    name: pickString(raw.name, '未命名人设'),
    description: pickString(raw.description),
    example_dialogue: pickString(raw.example_dialogue, raw.exampleDialogue),
  };
}

function normalizeMessage(value: unknown): MessageItem {
  const raw = asRecord(value);

  return {
    message_id: pickString(raw.message_id, raw.id),
    sender_type: normalizeSenderType(raw.sender_type),
    sender_id: pickString(raw.sender_id),
    sender_name: pickString(raw.sender_name, raw.senderName, raw.nickName),
    content: pickString(raw.content),
    content_type: pickString(raw.content_type, 'text') as 'text',
    timestamp: pickNumber(raw.timestamp, raw.created_at, DEFAULT_TIMESTAMP),
  };
}

function normalizeSummaryHighlight(value: unknown): SummaryHighlight {
  const raw = asRecord(value);

  return {
    visitor_id: pickString(raw.visitor_id),
    nickName: pickString(raw.nickName, raw.nickname, '高亮访客'),
    tags: pickStringArray(raw.tags),
    session_id: pickString(raw.session_id),
    status: normalizeConversationStatus(raw.status),
  };
}

function normalizeSummaryCard(value: unknown): SummaryCard {
  const raw = asRecord(value);

  return {
    summary_id: pickString(raw.summary_id),
    owner_user_id: pickString(raw.owner_user_id, OWNER_USER_ID),
    date: pickString(raw.date),
    visitor_count: pickNumber(raw.visitor_count),
    content: pickString(raw.content),
    visitor_highlights: asArray(raw.visitor_highlights).map(normalizeSummaryHighlight),
    deeplink: pickString(raw.deeplink),
    generated_at: pickNumber(raw.generated_at, DEFAULT_TIMESTAMP),
    pushed_at: pickNumber(raw.pushed_at) || undefined,
  };
}

function normalizeConversation(value: unknown): ConversationItem {
  const raw = asRecord(value);
  const lastMessageRaw = asRecord(raw.last_message);
  const peerUserRaw =
    raw.peer_user ??
    raw.visitor ??
    raw.visitor_user ??
    raw.visitor_profile ??
    raw.visitor_info;

  const status = normalizeConversationStatus(raw.status);
  const createdAt = pickNumber(raw.created_at, DEFAULT_TIMESTAMP);
  const lastMessageAt = pickNumber(
    raw.last_message_at,
    lastMessageRaw.timestamp,
    createdAt,
  );

  return {
    session_id: pickString(raw.session_id, raw.id),
    conversation_type:
      pickString(raw.conversation_type) === 'owner_im' ? 'owner_im' : 'host_visitor',
    peer_user: normalizeUser(peerUserRaw, buildFallbackUser({ role: 'visitor' })),
    owner_id: pickString(raw.owner_id, OWNER_USER_ID),
    iceman_id: pickString(raw.iceman_id, 'iceman_demo'),
    status,
    is_folded: pickBoolean(raw.is_folded) || status === 'filtered_folded',
    unread_count: pickNumber(raw.unread_count),
    last_message: {
      content_brief: pickString(lastMessageRaw.content_brief, lastMessageRaw.content),
      timestamp: lastMessageAt,
    },
    visitor_interest_tags: pickStringArray(raw.visitor_interest_tags, raw.tags, raw.interest_tags),
    filter_reason: pickString(raw.filter_reason),
    created_at: createdAt,
    last_message_at: lastMessageAt,
    takeover_at: pickNumber(raw.takeover_at) || null,
    is_owner_session: pickBoolean(raw.is_owner_session) || pickString(raw.conversation_type) === 'owner_im',
  };
}

function sortConversations(items: ConversationItem[]) {
  const rank: Record<ConversationStatus, number> = {
    host_takeover: 0,
    ai_chatting: 1,
    filtered_folded: 2,
    filtered_blocked: 3,
  };

  return [...items].sort((left, right) => {
    if (rank[left.status] !== rank[right.status]) {
      return rank[left.status] - rank[right.status];
    }

    return right.last_message_at - left.last_message_at;
  });
}

function resolveUserId(role: DemoRole, visitorUserId = DEFAULT_VISITOR_USER_ID) {
  return role === 'owner' ? OWNER_USER_ID : visitorUserId;
}

function getConversationBootstrapPayload(payload: unknown) {
  const raw = asRecord(payload);
  const conversation = raw.conversation;

  if (conversation && typeof conversation === 'object') {
    return {
      ...asRecord(conversation),
      session_id: pickString(asRecord(conversation).session_id, raw.session_id),
      opening_msg: pickString(raw.opening_msg, asRecord(conversation).opening_msg) || undefined,
    };
  }

  return raw;
}

export function getIcemanAvatar(avatarUrl?: string | null) {
  return avatarUrl || DEFAULT_ICEMAN_AVATAR;
}

export async function getMe(role: DemoRole, visitorUserId = DEFAULT_VISITOR_USER_ID): Promise<UserProfile> {
  const data = await requestApi<unknown>({
    method: 'GET',
    url: '/me',
    userId: resolveUserId(role, visitorUserId),
  });

  return normalizeUser(
    data,
    buildFallbackUser({
      open_id: resolveUserId(role, visitorUserId),
      role: role === 'owner' ? 'host' : 'visitor',
    }),
  );
}

export async function getConfig(): Promise<IcemanConfig> {
  const data = await requestApi<unknown>({
    method: 'GET',
    url: '/config',
    userId: OWNER_USER_ID,
  });

  return normalizeConfig(data);
}

export async function updateConfig(payload: UpdateConfigPayload): Promise<IcemanConfig> {
  const data = await requestApi<unknown>({
    method: 'PUT',
    url: '/config',
    data: payload,
    userId: OWNER_USER_ID,
  });

  return normalizeConfig(data);
}

export async function getPersonaTemplates(): Promise<PersonaTemplate[]> {
  const data = await requestApi<unknown>({
    method: 'GET',
    url: '/persona-templates',
    userId: OWNER_USER_ID,
  });

  return extractList(data, ['templates', 'persona_templates', 'items']).map(normalizePersonaTemplate);
}

export async function getBlacklist(): Promise<UserProfile[]> {
  return [];
}

export async function createOrRestoreConversation(
  visitorUserId = DEFAULT_VISITOR_USER_ID,
): Promise<ConversationItem> {
  const data = await requestApi<unknown>({
    method: 'POST',
    url: '/conversations',
    data: {
      visitor_id: visitorUserId,
    },
    userId: visitorUserId,
  });

  return normalizeConversation(getConversationBootstrapPayload(data));
}

export async function getVisitorConversations(showFolded = false): Promise<ConversationItem[]> {
  const data = await requestApi<unknown>({
    method: 'GET',
    url: '/conversations',
    params: {
      show_folded: showFolded,
    },
    userId: OWNER_USER_ID,
  });

  const items = extractList(data, ['conversations', 'items']).map(normalizeConversation);

  return sortConversations(
    items.filter((item) => item.status !== 'filtered_blocked'),
  );
}

export async function getConversation(
  id: string,
  role: DemoRole = 'owner',
  visitorUserId = DEFAULT_VISITOR_USER_ID,
): Promise<ConversationItem> {
  const data = await requestApi<unknown>({
    method: 'GET',
    url: `/conversations/${id}`,
    userId: resolveUserId(role, visitorUserId),
  });

  return normalizeConversation(data);
}

export async function getMessages(
  id: string,
  role: DemoRole = 'owner',
  visitorUserId = DEFAULT_VISITOR_USER_ID,
): Promise<MessageItem[]> {
  const data = await requestApi<unknown>({
    method: 'GET',
    url: `/conversations/${id}/messages`,
    userId: resolveUserId(role, visitorUserId),
  });

  return extractList(data, ['messages', 'items']).map(normalizeMessage);
}

export async function getHostDialogueMessages(limit = 50): Promise<MessageItem[]> {
  const data = await requestApi<unknown>({
    method: 'GET',
    url: '/host-dialogue',
    params: { limit },
    userId: OWNER_USER_ID,
  });

  return extractList(data, ['messages', 'items']).map(normalizeMessage);
}

export async function sendHostDialogueMessage(
  payload: SendMessagePayload,
): Promise<HostDialogueSendResult> {
  const data = await requestApi<unknown>({
    method: 'POST',
    url: '/host-dialogue',
    data: payload,
    userId: OWNER_USER_ID,
  });
  const raw = asRecord(data);

  return {
    message_id: pickString(raw.message_id, raw.id),
    timestamp: pickNumber(raw.timestamp, DEFAULT_TIMESTAMP),
    ai_reply: raw.ai_reply ? normalizeMessage(raw.ai_reply) : null,
  };
}

export async function sendMessage(
  id: string,
  role: DemoRole,
  payload: SendMessagePayload,
  visitorUserId = DEFAULT_VISITOR_USER_ID,
): Promise<SendMessageResult> {
  const data = await requestApi<unknown>({
    method: 'POST',
    url: `/conversations/${id}/messages`,
    data: payload,
    userId: resolveUserId(role, visitorUserId),
  });
  const raw = asRecord(data);

  return {
    message_id: pickString(raw.message_id, raw.id),
    timestamp: pickNumber(raw.timestamp, DEFAULT_TIMESTAMP),
    ai_reply: raw.ai_reply ? normalizeMessage(raw.ai_reply) : null,
    session_status: normalizeConversationStatus(raw.session_status),
  };
}

export async function takeoverConversation(id: string): Promise<TakeoverResult> {
  const data = await requestApi<unknown>({
    method: 'POST',
    url: `/conversations/${id}/takeover`,
    userId: OWNER_USER_ID,
  });
  const raw = asRecord(data);

  return {
    session_id: pickString(raw.session_id, id),
    takeover_at: pickNumber(raw.takeover_at, DEFAULT_TIMESTAMP),
    status: normalizeConversationStatus(raw.status),
    system_message: pickString(raw.system_message),
  };
}

export async function getSummaries(date?: string): Promise<SummaryCard[]> {
  const data = await requestApi<unknown>({
    method: 'GET',
    url: '/summaries',
    params: date ? { date } : undefined,
    userId: OWNER_USER_ID,
  });

  return extractList(data, ['summaries', 'items']).map(normalizeSummaryCard);
}

export async function generateSummary(date?: string): Promise<SummaryCard> {
  const data = await requestApi<unknown>({
    method: 'POST',
    url: '/summaries/generate',
    data: date ? { date } : undefined,
    userId: OWNER_USER_ID,
  });

  return normalizeSummaryCard(data);
}
