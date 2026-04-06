import {
  blacklist,
  configState,
  conversations,
  icemanProfile,
  messages,
  OWNER_IM_SESSION_ID,
  ownerProfile,
  personaTemplates,
  potentialConnections,
  PRIMARY_VISITOR_SESSION_ID,
  summaryCards,
  visitorProfile,
} from './mock-db';
import type {
  ConversationItem,
  DemoRole,
  IcemanConfig,
  IntentType,
  MessageItem,
  PotentialConnection,
  PersonaTemplate,
  SummaryCard,
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

function wait(ms = 240) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getConversationById(id: string) {
  const conversation = conversations.find((item) => item.session_id === id);

  if (!conversation) {
    throw { code: 40401, message: 'conversation not found' };
  }

  return conversation;
}

function getOwnerConversation() {
  return getConversationById(OWNER_IM_SESSION_ID);
}

function getCurrentTemplate() {
  return (
    personaTemplates.find((item) => item.template_id === configState.persona_template_id) ??
    personaTemplates[0]
  );
}

function syncConfigDerivedFields() {
  configState.persona_name = getCurrentTemplate().name;
}

let messageSeed = 10000;

function nextMessageId() {
  messageSeed += 1;
  return `msg_${messageSeed}`;
}

function createMessage(
  senderType: MessageItem['sender_type'],
  senderId: string,
  senderName: string,
  content: string,
  timestamp = Math.floor(Date.now() / 1000),
): MessageItem {
  return {
    message_id: nextMessageId(),
    sender_type: senderType,
    sender_id: senderId,
    sender_name: senderName,
    content,
    content_type: 'text',
    timestamp,
  };
}

function pushMessage(sessionId: string, message: MessageItem) {
  messages[sessionId] = [...(messages[sessionId] ?? []), message];
}

function updateSessionPreview(session: ConversationItem, content: string, timestamp: number) {
  session.last_message = {
    content_brief: content,
    timestamp,
  };
  session.last_message_at = timestamp;
}

function appendOwnerInboxNotice(content: string) {
  const ownerConversation = getOwnerConversation();
  const message = createMessage(
    'IceMan',
    configState.iceman_id,
    configState.nickname,
    content,
  );
  pushMessage(ownerConversation.session_id, message);
  ownerConversation.unread_count += 1;
  updateSessionPreview(ownerConversation, content, message.timestamp);
}

function ensureEnabledBootstrap() {
  if (!messages[OWNER_IM_SESSION_ID]?.length) {
    const bootstrap = createMessage(
      'IceMan',
      configState.iceman_id,
      configState.nickname,
      '主人，我已经恢复在线啦，随时可以帮你接住新的访客对话。',
    );
    messages[OWNER_IM_SESSION_ID] = [bootstrap];
    updateSessionPreview(getOwnerConversation(), bootstrap.content, bootstrap.timestamp);
  }
}

function classifyMessage(content: string): IntentType {
  const lowered = content.toLowerCase();

  if (
    lowered.includes('加微信') ||
    lowered.includes('vx') ||
    lowered.includes('联系方式') ||
    lowered.includes('住哪') ||
    lowered.includes('具体行程') ||
    lowered.includes('兼职') ||
    lowered.includes('推广') ||
    lowered.includes('福利群')
  ) {
    return 'PRIVACY_SENSITIVE';
  }

  if (
    lowered.includes('美女') ||
    lowered.includes('女朋友') ||
    lowered.includes('约吗') ||
    lowered.includes('宝贝')
  ) {
    return 'INAPPROPRIATE_REQUEST';
  }

  if (content.includes('？') || content.includes('?') || lowered.includes('吗')) {
    return 'GENERAL_INQUIRY';
  }

  return 'BENIGN_INTERACTION';
}

function getOwnerMemoryContext() {
  return (messages[OWNER_IM_SESSION_ID] ?? [])
    .filter((item) => item.sender_type === 'Host')
    .slice(-2)
    .map((item) => item.content)
    .join(' ');
}

function generateOwnerRepresentativeResponse(intent: IntentType) {
  if (intent === 'PRIVACY_SENSITIVE') {
    return '联系方式、具体行程和住址这些我先帮主人保密啦。不过如果你想聊滑雪、摄影或者最近的视频内容，我很愿意继续。';
  }

  return '这个方向我先不接啦，我们还是聊聊主人的视频和兴趣吧。如果你也喜欢滑雪、摄影或旅行，我可以继续陪你聊。';
}

function generateOwnerReply(content: string) {
  const trimmed = content.trim();

  if (!trimmed) {
    return '我在呢，想让我继续优化哪一段回复风格？';
  }

  if (trimmed.includes('总结')) {
    return '我可以继续按“访客数 + 共同兴趣点 + 2 位高价值访客”的结构给你生成每日总结。';
  }

  if (trimmed.includes('阿勒泰') || trimmed.includes('滑雪')) {
    return '记住啦，后面遇到聊阿勒泰和滑雪路线的人，我会主动把话题往攻略、雪感和拍照点上带。';
  }

  return `收到，我会参考你刚刚这句偏好继续调回复风格，当前人设是「${configState.persona_name}」。`;
}

function generateVisitorReply(session: ConversationItem, content: string) {
  const template = getCurrentTemplate();
  const leadTag = session.visitor_interest_tags[0] ?? ownerProfile.interests?.[0] ?? '视频作品';
  const ownerMemory = getOwnerMemoryContext();

  if (template.template_id === 'persona_002') {
    return `我能感觉到你是真的懂${leadTag}的人。主人最近也一直在留意这类内容，尤其在意聊天不要太端着，要像朋友一样自然一点。${
      ownerMemory ? '她刚刚还特地提醒我别暴露具体行程。' : ''
    }如果你愿意，我可以继续帮你把这条线索接下去。`;
  }

  if (template.template_id === 'persona_003') {
    return `收到。主人最近确实在关注${leadTag}，也更愿意和有具体经验的人聊天。你如果有一条最推荐的建议，直接告诉我就行，我会帮你准确转达。`;
  }

  return `这题她会很有兴趣！主人最近正好在看${leadTag}相关内容，而且刚提醒我聊天要自然、别端着。你要是愿意，可以继续说说${content.includes('阿勒泰') ? '阿勒泰路线' : '你最推荐的经验'}，我会认真帮你接住。`;
}

function cloneConversation(conversation: ConversationItem) {
  return {
    ...conversation,
    last_message: { ...conversation.last_message },
    visitor_interest_tags: [...conversation.visitor_interest_tags],
  };
}

function cloneMessage(message: MessageItem) {
  return { ...message };
}

function upsertSummary(card: SummaryCard) {
  const index = summaryCards.findIndex((item) => item.date === card.date);

  if (index >= 0) {
    summaryCards[index] = card;
    return;
  }

  summaryCards.unshift(card);
}

export async function getMe(role: DemoRole): Promise<UserProfile> {
  await wait();
  return role === 'owner' ? ownerProfile : visitorProfile;
}

export async function getConfig(): Promise<IcemanConfig> {
  await wait();
  syncConfigDerivedFields();
  return { ...configState };
}

export async function updateConfig(payload: UpdateConfigPayload): Promise<IcemanConfig> {
  await wait();
  syncConfigDerivedFields();

  if (payload.action === 'enable') {
    configState.status = 'enabled';
    ensureEnabledBootstrap();
    appendOwnerInboxNotice('我已经重新上线啦，会继续按照你最近的偏好和视频内容帮你接待访客。');
  }

  if (payload.action === 'disable') {
    configState.status = 'disabled';
  }

  if (payload.action === 'update') {
    if (payload.nickname) {
      configState.nickname = payload.nickname;
      appendOwnerInboxNotice(`收到，之后我会以「${configState.nickname}」的身份继续回复访客。`);
    }

    if (payload.persona_template_id) {
      configState.persona_template_id = payload.persona_template_id;
      syncConfigDerivedFields();
      appendOwnerInboxNotice(`人设已切换为「${configState.persona_name}」，后续回复语气会同步调整。`);
    }
  }

  syncConfigDerivedFields();
  return { ...configState };
}

export async function getPersonaTemplates(): Promise<PersonaTemplate[]> {
  await wait();
  return [...personaTemplates];
}

export async function getBlacklist(): Promise<UserProfile[]> {
  await wait();
  return [...blacklist];
}

export async function getOwnerConversationEntry(): Promise<ConversationItem | null> {
  await wait();

  if (configState.status === 'disabled') {
    return null;
  }

  return cloneConversation(getOwnerConversation());
}

export async function getVisitorConversations(showFolded = false): Promise<ConversationItem[]> {
  await wait();

  return conversations
    .filter((item) => !item.is_owner_session)
    .filter((item) => item.status !== 'filtered_blocked')
    .filter((item) => showFolded || item.status !== 'filtered_folded')
    .sort((a, b) => {
      const rank: Record<ConversationItem['status'], number> = {
        host_takeover: 0,
        ai_chatting: 1,
        filtered_folded: 2,
        filtered_blocked: 3,
      };

      if (rank[a.status] !== rank[b.status]) {
        return rank[a.status] - rank[b.status];
      }

      return b.last_message_at - a.last_message_at;
    })
    .map(cloneConversation);
}

export async function getConversation(id: string): Promise<ConversationItem> {
  await wait();
  return cloneConversation(getConversationById(id));
}

export async function getMessages(id: string): Promise<MessageItem[]> {
  await wait();
  getConversationById(id);
  return [...(messages[id] ?? [])].map(cloneMessage);
}

export async function sendMessage(
  id: string,
  role: DemoRole,
  payload: SendMessagePayload,
): Promise<{
  message_id: string;
  timestamp: number;
  intent: IntentType;
  ai_reply: MessageItem | null;
  session_status: ConversationItem['status'];
}> {
  await wait(180);

  const conversation = getConversationById(id);

  if (configState.status === 'disabled' && role === 'visitor') {
    throw { code: 40303, message: 'iceman disabled' };
  }

  const createdAt = Math.floor(Date.now() / 1000);
  const message = createMessage(
    role === 'owner' ? 'Host' : 'Visitor',
    role === 'owner' ? ownerProfile.open_id : conversation.peer_user.open_id,
    role === 'owner' ? ownerProfile.nickName : conversation.peer_user.nickName,
    payload.content,
    createdAt,
  );

  pushMessage(id, message);
  updateSessionPreview(conversation, payload.content, createdAt);

  if (role === 'owner') {
    if (conversation.is_owner_session) {
      const aiReply = createMessage(
        'IceMan',
        configState.iceman_id,
        configState.nickname,
        generateOwnerReply(payload.content),
        createdAt + 1,
      );
      pushMessage(id, aiReply);
      updateSessionPreview(conversation, aiReply.content, aiReply.timestamp);
      conversation.unread_count += 1;

      return {
        message_id: message.message_id,
        timestamp: message.timestamp,
        intent: 'GENERAL_INQUIRY',
        ai_reply: cloneMessage(aiReply),
        session_status: conversation.status,
      };
    }

    return {
      message_id: message.message_id,
      timestamp: message.timestamp,
      intent: 'GENERAL_INQUIRY',
      ai_reply: null,
      session_status: conversation.status,
    };
  }

  if (conversation.status === 'filtered_blocked') {
    throw { code: 40301, message: 'cannot send to blocked conversation' };
  }

  if (conversation.status === 'host_takeover') {
    return {
      message_id: message.message_id,
      timestamp: message.timestamp,
      intent: 'BENIGN_INTERACTION',
      ai_reply: null,
      session_status: conversation.status,
    };
  }

  const intent = classifyMessage(payload.content);

  if (intent === 'INAPPROPRIATE_REQUEST' || intent === 'PRIVACY_SENSITIVE') {
    const reply = createMessage(
      'IceMan',
      configState.iceman_id,
      configState.nickname,
      generateOwnerRepresentativeResponse(intent),
      createdAt + 1,
    );
    pushMessage(id, reply);
    conversation.status = 'filtered_folded';
    conversation.is_folded = true;
    conversation.filter_reason =
      intent === 'PRIVACY_SENSITIVE' ? '隐私/导流相关问题已折叠处理。' : '不当请求已折叠处理。';
    updateSessionPreview(conversation, reply.content, reply.timestamp);

    return {
      message_id: message.message_id,
      timestamp: message.timestamp,
      intent,
      ai_reply: cloneMessage(reply),
      session_status: conversation.status,
    };
  }

  const aiReply = createMessage(
    'IceMan',
    configState.iceman_id,
    configState.nickname,
    generateVisitorReply(conversation, payload.content),
    createdAt + 1,
  );
  pushMessage(id, aiReply);
  conversation.status = 'ai_chatting';
  conversation.is_folded = false;
  conversation.filter_reason = '';
  updateSessionPreview(conversation, aiReply.content, aiReply.timestamp);

  return {
    message_id: message.message_id,
    timestamp: message.timestamp,
    intent,
    ai_reply: cloneMessage(aiReply),
    session_status: conversation.status,
  };
}

export async function takeoverConversation(id: string) {
  await wait();
  const conversation = getConversationById(id);

  if (conversation.status === 'filtered_blocked') {
    throw { code: 40301, message: 'cannot takeover blocked conversation' };
  }

  if (conversation.status === 'host_takeover') {
    throw { code: 40302, message: 'already takeover' };
  }

  conversation.status = 'host_takeover';
  conversation.is_folded = false;
  conversation.takeover_at = Math.floor(Date.now() / 1000);
  const systemMessage = '主人觉得你很有趣，决定亲自和你聊聊～';

  pushMessage(
    id,
    createMessage(
      'System',
      configState.iceman_id,
      'System',
      systemMessage,
      conversation.takeover_at,
    ),
  );
  updateSessionPreview(conversation, systemMessage, conversation.takeover_at);

  return {
    session_id: id,
    takeover_at: conversation.takeover_at,
    status: conversation.status,
    system_message: systemMessage,
  };
}

export async function getSummaries(date?: string): Promise<SummaryCard[]> {
  await wait();

  if (configState.status === 'disabled') {
    return [];
  }

  return summaryCards
    .filter((item) => (date ? item.date === date : true))
    .map((item) => ({
      ...item,
      visitor_highlights: item.visitor_highlights.map((highlight) => ({ ...highlight })),
    }));
}

export async function generateSummary(date = '2026-04-05'): Promise<SummaryCard> {
  await wait(360);

  const visibleSessions = conversations.filter(
    (item) =>
      item.conversation_type === 'host_visitor' &&
      item.status !== 'filtered_blocked' &&
      item.session_id.includes(date.replaceAll('-', '')),
  );
  const highlights = visibleSessions
    .filter((item) => item.status !== 'filtered_folded')
    .slice(0, 3)
    .map((item) => ({
      visitor_id: item.peer_user.open_id,
      nickName: item.peer_user.nickName,
      tags: item.visitor_interest_tags.slice(0, 3),
      session_id: item.session_id,
      status: item.status,
    }));
  const highlightText = highlights
    .slice(0, 2)
    .map((item) => `${item.nickName} 和你都聊到了 ${item.tags.slice(0, 2).join('、')}`)
    .join('；');
  const generatedAt = Math.floor(Date.now() / 1000);
  const card: SummaryCard = {
    summary_id: `sum_${date.replaceAll('-', '')}_owner123`,
    owner_user_id: ownerProfile.open_id,
    date,
    visitor_count: visibleSessions.length,
    content: `今天共有 ${visibleSessions.length} 位访客与我对话。其中，${highlightText || '大家主要都围绕滑雪、摄影和日常兴趣展开了聊天'}。`,
    visitor_highlights: highlights,
    deeplink: `/iceman/conversations?date=${date}`,
    generated_at: generatedAt,
    pushed_at: generatedAt + 5,
  };

  upsertSummary(card);
  appendOwnerInboxNotice(`我刚帮你刷新了 ${date} 的总结卡片，可以去 IM 页直接查看。`);

  return {
    ...card,
    visitor_highlights: card.visitor_highlights.map((item) => ({ ...item })),
  };
}

export async function getPotentialConnection(sessionId: string): Promise<PotentialConnection> {
  await wait();

  return potentialConnections[sessionId] ?? {
    is_potential: false,
    reason: '当前还没有足够的高质量信号。',
  };
}

export function getIcemanAvatar() {
  return icemanProfile.avatarUrl;
}

export function getHostAvatar() {
  return ownerProfile.avatarUrl;
}

export function getPrimaryVisitorSessionId() {
  return PRIMARY_VISITOR_SESSION_ID;
}
