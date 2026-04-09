import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Empty, Input, Typography, message } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import {
  createOrRestoreConversation,
  getConfig,
  getConversation,
  getIcemanAvatar,
  getMe,
  getMessages,
  sendMessage,
} from '../api/service';
import { MessageBubble } from '../components/message-bubble';
import { useAppStore } from '../stores/app-store';
import type { MessageItem } from '../types/models';
import { getErrorMessage } from '../utils/error';

export function VisitorChatPage() {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const activeVisitorId = useAppStore((state) => state.activeVisitorId);

  const { data: bootstrappedConversation } = useQuery({
    queryKey: ['visitor-conversation-bootstrap', activeVisitorId],
    queryFn: () => createOrRestoreConversation(activeVisitorId),
  });
  const conversationId = bootstrappedConversation?.session_id;

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  });
  const { data: owner } = useQuery({
    queryKey: ['me', 'owner'],
    queryFn: () => getMe('owner'),
  });
  const { data: visitor } = useQuery({
    queryKey: ['me', 'visitor', activeVisitorId],
    queryFn: () => getMe('visitor', activeVisitorId),
  });
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId, 'visitor', activeVisitorId],
    queryFn: () => getConversation(conversationId!, 'visitor', activeVisitorId),
    enabled: Boolean(conversationId),
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversationId, 'visitor', activeVisitorId],
    queryFn: () => getMessages(conversationId!, 'visitor', activeVisitorId),
    enabled: Boolean(conversationId),
  });
  const messagesQueryKey = ['messages', conversationId, 'visitor', activeVisitorId] as const;
  const conversationQueryKey = ['conversation', conversationId, 'visitor', activeVisitorId] as const;

  const sendMutation = useMutation({
    mutationFn: (value: string) =>
      sendMessage(
        conversationId!,
        'visitor',
        { content: value, content_type: 'text' },
        activeVisitorId,
      ),
    onSuccess: async (result, sentContent) => {
      const nextMessages: MessageItem[] = [
        {
          message_id: result.message_id,
          sender_type: 'Visitor',
          sender_id: visitor?.open_id ?? activeVisitorId,
          sender_name: visitor?.nickName ?? '访客',
          content: sentContent,
          content_type: 'text',
          timestamp: result.timestamp,
        },
      ];

      if (result.ai_reply) {
        nextMessages.push(result.ai_reply);
      }

      queryClient.setQueryData<MessageItem[]>(messagesQueryKey, (current = []) => {
        const knownIds = new Set(current.map((item) => item.message_id));
        const appended = nextMessages.filter((item) => !knownIds.has(item.message_id));

        return appended.length ? [...current, ...appended] : current;
      });

      setContent('');
      await queryClient.invalidateQueries({ queryKey: messagesQueryKey });
      await queryClient.invalidateQueries({ queryKey: conversationQueryKey });
      await queryClient.invalidateQueries({ queryKey: ['visitor-conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['summaries'] });
    },
    onError: (error: { code?: number; message?: string }) => {
      message.error(getErrorMessage(error.code ?? 50001, error.message ?? '发送失败'));
    },
  });

  if (!conversation || !config || !owner || !visitor) {
    return <Empty description="访客会话加载中" />;
  }

  const isTakenOver = conversation.status === 'host_takeover';
  const isBlocked = conversation.status === 'filtered_blocked';
  const counterpartAvatar = isTakenOver ? owner.avatarUrl : getIcemanAvatar(config.avatarUrl);

  return (
    <div className="mobile-page mobile-page--chat">
      <div className="chat-topbar">
        <button type="button" className="icon-circle" onClick={() => navigate('/launch')}>
          <LeftOutlined />
        </button>
        <div className="chat-topbar__title">
          <img
            src={counterpartAvatar}
            alt={isTakenOver ? owner.nickName : config.nickname}
            className="chat-topbar__avatar"
          />
          <span>{isTakenOver ? owner.nickName : config.nickname}</span>
        </div>
        <div className="chat-topbar__actions" />
      </div>

      {isTakenOver ? (
        <div className="visitor-status-bar">主人已接管，本轮聊天将由真人继续回复。</div>
      ) : conversation.status === 'filtered_folded' ? (
        <div className="visitor-status-bar visitor-status-bar--warning">
          某些敏感或不当话题会被自动折叠处理。
        </div>
      ) : null}

      <div className="chat-body">
        {messages.map((item) => (
          <MessageBubble
            key={item.message_id}
            message={item}
            visitorAvatar={visitor.avatarUrl || conversation.peer_user.avatarUrl}
            icemanAvatar={counterpartAvatar}
            hostAvatar={owner.avatarUrl}
            variant="thread"
          />
        ))}
      </div>

      <div className="chat-input-shell">
        <button type="button" className="icon-circle icon-circle--soft">
          <span className="grid-icon" />
        </button>
        <Input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={
            config.status === 'disabled'
              ? '对方暂时关闭了小助手'
              : isBlocked
                ? '当前会话已被屏蔽'
                : '发送消息'
          }
          disabled={config.status === 'disabled' || isBlocked}
          onPressEnter={(event) => {
            event.preventDefault();
            const next = content.trim();

            if (next && config.status === 'enabled' && !isBlocked) {
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

      {config.status === 'disabled' ? (
        <div className="visitor-disabled-tip">
          <Typography.Text>小冰人已暂停服务，稍后再来看看吧。</Typography.Text>
        </div>
      ) : null}
    </div>
  );
}
