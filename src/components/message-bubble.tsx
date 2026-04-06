import { Avatar, Typography } from 'antd';
import type { MessageItem } from '../types/models';
import { formatClock } from '../utils/time';

type Props = {
  message: MessageItem;
  visitorAvatar: string;
  icemanAvatar: string;
  hostAvatar: string;
  variant: 'owner-im' | 'thread';
};

export function MessageBubble({
  message,
  visitorAvatar,
  icemanAvatar,
  hostAvatar,
  variant,
}: Props) {
  if (message.sender_type === 'System') {
    return (
      <div className="message-system">
        <span>{message.content}</span>
      </div>
    );
  }

  const isRight = variant === 'owner-im' ? message.sender_type === 'Host' : message.sender_type === 'Visitor';

  const avatar =
    message.sender_type === 'Visitor'
      ? visitorAvatar
      : message.sender_type === 'Host'
        ? hostAvatar
        : icemanAvatar;

  return (
    <div className={`message-row ${isRight ? 'is-right' : 'is-left'}`}>
      {!isRight ? <Avatar src={avatar} size={36} /> : null}
      <div className={`message-bubble ${isRight ? 'is-right' : 'is-left'}`}>
        <Typography.Paragraph className="message-text">{message.content}</Typography.Paragraph>
        <Typography.Text type="secondary">{formatClock(message.timestamp)}</Typography.Text>
      </div>
      {isRight ? <Avatar src={avatar} size={36} /> : null}
    </div>
  );
}
