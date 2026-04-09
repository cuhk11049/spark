import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Badge, Empty, Input, message } from 'antd';
import { LeftOutlined, OrderedListOutlined } from '@ant-design/icons';
import {
  getConfig,
  getConversation,
  getIcemanAvatar,
  getMessages,
  getSummaries,
  getVisitorConversations,
  sendMessage,
} from '../api/service';
import type { MessageItem, SummaryHighlight } from '../types/models';
import { getErrorMessage } from '../utils/error';

function pickHighlightMessages(items: MessageItem[]) {
  const visitorIndex = [...items]
    .reverse()
    .findIndex((item) => item.sender_type === 'Visitor');

  if (visitorIndex === -1) {
    return { icemanMessage: null, visitorMessage: null };
  }

  const actualVisitorIndex = items.length - 1 - visitorIndex;
  const visitorMessage = items[actualVisitorIndex];
  const icemanMessage =
    [...items.slice(0, actualVisitorIndex)].reverse().find((item) => item.sender_type === 'IceMan') ?? null;

  return { icemanMessage, visitorMessage };
}

function HighlightCard({
  item,
  icemanAvatar,
  icemanName,
}: {
  item: SummaryHighlight;
  icemanAvatar: string;
  icemanName: string;
}) {
  const navigate = useNavigate();
  const { data: conversation } = useQuery({
    queryKey: ['conversation', item.session_id, 'owner'],
    queryFn: () => getConversation(item.session_id, 'owner'),
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', item.session_id, 'owner'],
    queryFn: () => getMessages(item.session_id, 'owner'),
  });

  if (!conversation) {
    return null;
  }

  const { icemanMessage, visitorMessage } = pickHighlightMessages(messages);

  return (
    <button
      type="button"
      className="im-highlight-card"
      onClick={() => navigate(`/host-chat/${item.session_id}`)}
    >
      <div className="im-highlight-card__title">今天遇到的有趣灵魂：</div>
      <div className="im-highlight-card__inner">
        {icemanMessage ? (
          <div className="im-highlight-bubble is-left">
            <img src={icemanAvatar} alt={icemanName} className="im-highlight-bubble__avatar" />
            <div className="im-highlight-bubble__content">{icemanMessage.content}</div>
          </div>
        ) : null}
        {visitorMessage ? (
          <div className="im-highlight-bubble is-right">
            <div className="im-highlight-bubble__content">{visitorMessage.content}</div>
            <img
              src={conversation.peer_user.avatarUrl}
              alt={conversation.peer_user.nickName}
              className="im-highlight-bubble__avatar"
            />
          </div>
        ) : null}
      </div>
    </button>
  );
}

export function ImPage() {
  const [content, setContent] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  });
  const { data: summaries = [] } = useQuery({
    queryKey: ['summaries'],
    queryFn: () => getSummaries(),
  });
  const { data: conversations = [] } = useQuery({
    queryKey: ['visitor-conversations', 'with-folded'],
    queryFn: () => getVisitorConversations(true),
  });

  const ownerConversation = conversations.find(
    (item) => item.is_owner_session || item.conversation_type === 'owner_im',
  );
  const ownerConversationId = ownerConversation?.session_id;

  const sendMutation = useMutation({
    mutationFn: (value: string) =>
      sendMessage(ownerConversationId!, 'owner', { content: value, content_type: 'text' }),
    onSuccess: async () => {
      setContent('');
      await queryClient.invalidateQueries({ queryKey: ['messages', ownerConversationId] });
      await queryClient.invalidateQueries({ queryKey: ['conversation', ownerConversationId] });
      await queryClient.invalidateQueries({ queryKey: ['visitor-conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['summaries'] });
    },
    onError: async (error: { code?: number; message?: string }) => {
      if (error.code === 40401) {
        await queryClient.invalidateQueries({ queryKey: ['visitor-conversations'] });
      }

      message.error(getErrorMessage(error.code ?? 50001, error.message ?? '发送失败'));
    },
  });

  const todaySummary = summaries[0];
  const icemanAvatar = getIcemanAvatar(config?.avatarUrl);
  const icemanName = config?.nickname ?? '小冰人';
  const isDisabled = config?.status === 'disabled';
  const isInputDisabled = isDisabled || !ownerConversationId || sendMutation.isPending;

  return (
    <div className="mobile-page mobile-page--chat im-page">
      <div className="chat-topbar im-topbar">
        <button type="button" className="icon-circle" onClick={() => navigate('/config')}>
          <LeftOutlined />
        </button>
        <div className="chat-topbar__title">
          <img src={icemanAvatar} alt={icemanName} className="chat-topbar__avatar" />
          <span>{icemanName}</span>
        </div>
        <button type="button" className="icon-circle" onClick={() => navigate('/records')}>
          <Badge count={todaySummary?.visitor_count ?? 0} size="small">
            <OrderedListOutlined />
          </Badge>
        </button>
      </div>

      <div className="chat-timestamp">刚刚</div>

      <div className="im-page__body">
        {todaySummary?.visitor_highlights?.length ? (
          todaySummary.visitor_highlights.slice(0, 1).map((item) => (
            <div key={item.session_id} className="im-page__row">
              <img
                src={icemanAvatar}
                alt={icemanName}
                className="im-page__side-avatar"
              />
              <HighlightCard item={item} icemanAvatar={icemanAvatar} icemanName={icemanName} />
            </div>
          ))
        ) : (
          <div className="empty-card">
            <Empty description="暂无对话高光" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )}
      </div>

      <div className="chat-input-shell">
        <button type="button" className="icon-circle icon-circle--soft">
          <span className="grid-icon" />
        </button>
        <Input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={
            isDisabled
              ? '小冰人当前已关闭'
              : !ownerConversationId
                ? '主人 IM 会话还没有准备好'
                : '给自己的小冰人发送消息'
          }
          disabled={isInputDisabled}
          onPressEnter={(event) => {
            event.preventDefault();
            const next = content.trim();

            if (next && ownerConversationId && !isDisabled) {
              sendMutation.mutate(next);
            }
          }}
        />
        <button type="button" className="icon-circle icon-circle--soft">
          🙂
        </button>
        <button type="button" className="icon-circle icon-circle--soft">
          +
        </button>
      </div>
    </div>
  );
}
