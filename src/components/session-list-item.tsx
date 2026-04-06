import { Avatar, Badge, Tag, Typography } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import type { ConversationItem } from '../types/models';
import { formatDateTime } from '../utils/time';

const statusMap: Record<ConversationItem['status'], { color: string; label: string }> = {
  host_takeover: { color: 'magenta', label: '已接管' },
  ai_chatting: { color: 'blue', label: 'AI托管中' },
  filtered_folded: { color: 'orange', label: '打扰信息' },
  filtered_blocked: { color: 'red', label: '已屏蔽' },
};

export function SessionListItem({
  item,
  extraAvatar,
  title,
  onClick,
  compact,
  variant = 'default',
}: {
  item: ConversationItem;
  extraAvatar?: string;
  title?: string;
  onClick?: () => void;
  compact?: boolean;
  variant?: 'default' | 'records';
}) {
  if (variant === 'records') {
    return (
      <button type="button" className="records-session-card" onClick={onClick}>
        <div className="records-session-card__avatar">
          <Avatar size={56} src={extraAvatar ?? item.peer_user.avatarUrl} />
        </div>
        <div className="records-session-card__content">
          <Typography.Text strong className="records-session-card__name">
            {title ?? item.peer_user.nickName}
          </Typography.Text>
          <Typography.Paragraph ellipsis={{ rows: 1 }} className="records-session-card__message">
            {item.last_message.content_brief || '暂无消息'}
          </Typography.Paragraph>
        </div>
        <RightOutlined className="records-session-card__arrow" />
      </button>
    );
  }

  return (
    <button type="button" className={`session-card ${compact ? 'is-compact' : ''}`} onClick={onClick}>
      <div className="session-card__avatar">
        <Badge count={item.unread_count > 0 ? item.unread_count : 0} size="small">
          <Avatar size={compact ? 42 : 54} src={extraAvatar ?? item.peer_user.avatarUrl} />
        </Badge>
      </div>
      <div className="session-card__content">
        <div className="session-card__topline">
          <Typography.Text strong>{title ?? item.peer_user.nickName}</Typography.Text>
          <Typography.Text type="secondary">{formatDateTime(item.last_message.timestamp)}</Typography.Text>
        </div>
        <Typography.Paragraph ellipsis={{ rows: 1 }} className="session-card__message">
          {item.last_message.content_brief || '暂无消息'}
        </Typography.Paragraph>
        <div className="session-card__meta">
          <Tag color={statusMap[item.status].color}>{statusMap[item.status].label}</Tag>
          {!compact
            ? item.visitor_interest_tags.slice(0, 2).map((tag) => (
                <span key={tag} className="session-card__topic">
                  {tag}
                </span>
              ))
            : null}
          {item.unread_count > 0 ? <span className="session-card__unread">{item.unread_count}</span> : null}
        </div>
      </div>
      <RightOutlined className="session-card__arrow" />
    </button>
  );
}
