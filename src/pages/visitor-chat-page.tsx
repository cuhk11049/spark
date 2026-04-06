import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Empty, Input, Typography, message } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import {
  getConfig,
  getConversation,
  getHostAvatar,
  getIcemanAvatar,
  getMe,
  getMessages,
  getPrimaryVisitorSessionId,
  sendMessage,
} from '../api/service';
import { MessageBubble } from '../components/message-bubble';
import { getErrorMessage } from '../utils/error';

export function VisitorChatPage() {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const conversationId = getPrimaryVisitorSessionId();

  const { data: config } = useQuery({ queryKey: ['config'], queryFn: getConfig });
  const { data: owner } = useQuery({
    queryKey: ['me', 'owner'],
    queryFn: () => getMe('owner'),
  });
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
  });

  const sendMutation = useMutation({
    mutationFn: (value: string) =>
      sendMessage(conversationId, 'visitor', { content: value, content_type: 'text' }),
    onSuccess: async () => {
      setContent('');
      await queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['visitor-conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['summaries'] });
    },
    onError: (error: { code?: number; message?: string }) => {
      message.error(getErrorMessage(error.code ?? 50001, error.message ?? '发送失败'));
    },
  });

  if (!conversation || !config || !owner) {
    return <Empty description="访客会话不存在" />;
  }

  const isTakenOver = conversation.status === 'host_takeover';
  const isBlocked = conversation.status === 'filtered_blocked';
  const counterpartAvatar = isTakenOver ? getHostAvatar() : getIcemanAvatar();

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
            visitorAvatar={conversation.peer_user.avatarUrl}
            icemanAvatar={counterpartAvatar}
            hostAvatar={getHostAvatar()}
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
              ? '主人暂时关闭了小冰人服务'
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
          😊
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
