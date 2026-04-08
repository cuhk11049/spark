import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Empty, Input, Typography, message } from 'antd';
import { LeftOutlined, OrderedListOutlined, VideoCameraOutlined } from '@ant-design/icons';
import {
  getConfig,
  getConversation,
  getIcemanAvatar,
  getMe,
  getMessages,
  sendMessage,
  takeoverConversation,
} from '../api/service';
import { MessageBubble } from '../components/message-bubble';
import { getErrorMessage } from '../utils/error';

const quickReplies = ['先接住兴趣点', '提醒别暴露行程', '把话题带到视频', '我来接管'];

export function HostChatPage() {
  const { id = '' } = useParams();
  const [content, setContent] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  });
  const { data: owner } = useQuery({
    queryKey: ['me', 'owner'],
    queryFn: () => getMe('owner'),
  });
  const { data: conversation } = useQuery({
    queryKey: ['conversation', id, 'owner'],
    queryFn: () => getConversation(id, 'owner'),
    enabled: Boolean(id),
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', id, 'owner'],
    queryFn: () => getMessages(id, 'owner'),
    enabled: Boolean(id),
  });

  const sendMutation = useMutation({
    mutationFn: (value: string) => sendMessage(id, 'owner', { content: value, content_type: 'text' }),
    onSuccess: async () => {
      setContent('');
      await queryClient.invalidateQueries({ queryKey: ['messages', id] });
      await queryClient.invalidateQueries({ queryKey: ['conversation', id] });
      await queryClient.invalidateQueries({ queryKey: ['visitor-conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['summaries'] });
    },
    onError: (error: { code?: number; message?: string }) => {
      message.error(getErrorMessage(error.code ?? 50001, error.message ?? '发送失败'));
    },
  });

  const takeoverMutation = useMutation({
    mutationFn: () => takeoverConversation(id),
    onSuccess: async () => {
      message.success('已接管该会话');
      await queryClient.invalidateQueries({ queryKey: ['messages', id] });
      await queryClient.invalidateQueries({ queryKey: ['conversation', id] });
      await queryClient.invalidateQueries({ queryKey: ['visitor-conversations'] });
    },
    onError: (error: { code?: number; message?: string }) => {
      message.error(getErrorMessage(error.code ?? 50001, error.message ?? '接管失败'));
    },
  });

  if (!id || !conversation || !config || !owner) {
    return <Empty description="会话加载中" />;
  }

  const isTakenOver = conversation.status === 'host_takeover';
  const canTakeover =
    conversation.status !== 'host_takeover' &&
    conversation.status !== 'filtered_blocked';
  const showInput = isTakenOver;
  const icemanAvatar = getIcemanAvatar(config.avatarUrl);

  return (
    <div className="mobile-page mobile-page--chat">
      <div className="chat-topbar">
        <button type="button" className="icon-circle" onClick={() => navigate('/records')}>
          <LeftOutlined />
        </button>
        <div className="chat-topbar__title">
          <img
            src={conversation.peer_user.avatarUrl}
            alt={conversation.peer_user.nickName}
            className="chat-topbar__avatar"
          />
          <span>{conversation.peer_user.nickName}</span>
        </div>
        <div className="chat-topbar__actions">
          <button type="button" className="icon-circle">
            <VideoCameraOutlined />
          </button>
          <button type="button" className="icon-circle" onClick={() => navigate('/im')}>
            <Badge count={0} size="small">
              <OrderedListOutlined />
            </Badge>
          </button>
        </div>
      </div>

      <div className="chat-timestamp">{isTakenOver ? '主人已接管' : '最近更新'}</div>

      <div className="chat-context-card">
        <div className="tag-cluster">
          {conversation.visitor_interest_tags.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
        </div>
        {conversation.filter_reason ? (
          <div className="context-pill is-warning">{conversation.filter_reason}</div>
        ) : null}
      </div>

      <div className="chat-body">
        {messages.map((item) => (
          <MessageBubble
            key={item.message_id}
            message={item}
            visitorAvatar={conversation.peer_user.avatarUrl}
            icemanAvatar={icemanAvatar}
            hostAvatar={owner.avatarUrl}
            variant="thread"
          />
        ))}
      </div>

      {!isTakenOver ? (
        <div className="quick-replies">
          {quickReplies.map((item) => (
            <button
              key={item}
              type="button"
              className="quick-reply-chip"
              onClick={() => setContent(item)}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}

      {canTakeover && !isTakenOver ? (
        <div className="takeover-bar">
          <Button
            type="primary"
            block
            size="large"
            className="takeover-button"
            loading={takeoverMutation.isPending}
            onClick={() => takeoverMutation.mutate()}
          >
            点击接管
          </Button>
        </div>
      ) : null}

      {showInput ? (
        <div className="chat-input-shell">
          <button type="button" className="icon-circle icon-circle--soft">
            <span className="grid-icon" />
          </button>
          <Input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="以主人身份继续聊天"
            onPressEnter={(event) => {
              event.preventDefault();
              const next = content.trim();

              if (next) {
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
      ) : (
        <div className="takeover-hint">
          <Typography.Text>接管后，访客侧会收到系统提示，并切换为真人继续对话。</Typography.Text>
        </div>
      )}
    </div>
  );
}
