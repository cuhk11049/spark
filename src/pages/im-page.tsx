import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Badge, Empty, Input, Typography, message } from 'antd';
import { LeftOutlined, OrderedListOutlined } from '@ant-design/icons';
import {
  getConfig,
  getHostDialogueMessages,
  getIcemanAvatar,
  getMe,
  getSummaries,
  sendHostDialogueMessage,
} from '../api/service';
import { MessageBubble } from '../components/message-bubble';
import { getErrorMessage } from '../utils/error';

export function ImPage() {
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
  const { data: summaries = [] } = useQuery({
    queryKey: ['summaries'],
    queryFn: () => getSummaries(),
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['host-dialogue', 'messages'],
    queryFn: () => getHostDialogueMessages(),
  });

  const sendMutation = useMutation({
    mutationFn: (value: string) =>
      sendHostDialogueMessage({ content: value, content_type: 'text' }),
    onSuccess: async () => {
      setContent('');
      await queryClient.invalidateQueries({ queryKey: ['host-dialogue', 'messages'] });
      await queryClient.invalidateQueries({ queryKey: ['summaries'] });
    },
    onError: (error: { code?: number; message?: string }) => {
      message.error(getErrorMessage(error.code ?? 50001, error.message ?? '发送失败'));
    },
  });

  if (!config || !owner) {
    return <Empty description="主人私聊加载中" />;
  }

  const todaySummary = summaries[0];
  const icemanAvatar = getIcemanAvatar(config.avatarUrl);
  const icemanName = config.nickname || '小冰人';
  const isDisabled = config.status === 'disabled';

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

      <div className="chat-timestamp">主人与小冰人的私聊</div>

      <div className="chat-context-card">
        <Typography.Text strong>当前模式：{config.persona_name}</Typography.Text>
        <Typography.Text type="secondary">
          这里是独立于访客会话的私聊通道，用来和小冰人同步风格、总结和偏好。
        </Typography.Text>
      </div>

      <div className="chat-body">
        {messages.length ? (
          messages.map((item) => (
            <MessageBubble
              key={item.message_id}
              message={item}
              visitorAvatar={owner.avatarUrl}
              icemanAvatar={icemanAvatar}
              hostAvatar={owner.avatarUrl}
              variant="owner-im"
            />
          ))
        ) : (
          <div className="empty-card">
            <Empty description="还没有私聊记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
          placeholder={isDisabled ? '小冰人当前已关闭' : '给自己的小冰人发送消息'}
          disabled={isDisabled || sendMutation.isPending}
          onPressEnter={(event) => {
            event.preventDefault();
            const next = content.trim();

            if (next && !isDisabled) {
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
