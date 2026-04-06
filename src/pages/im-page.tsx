import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Badge, Empty } from 'antd';
import { LeftOutlined, OrderedListOutlined } from '@ant-design/icons';
import {
  getConfig,
  getConversation,
  getIcemanAvatar,
  getMessages,
  getSummaries,
} from '../api/service';
import type { MessageItem, SummaryHighlight } from '../types/models';

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
  icemanName,
}: {
  item: SummaryHighlight;
  icemanName: string;
}) {
  const navigate = useNavigate();
  const { data: conversation } = useQuery({
    queryKey: ['conversation', item.session_id],
    queryFn: () => getConversation(item.session_id),
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', item.session_id],
    queryFn: () => getMessages(item.session_id),
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
            <img src={getIcemanAvatar()} alt={icemanName} className="im-highlight-bubble__avatar" />
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
  const navigate = useNavigate();
  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  });
  const { data: summaries = [] } = useQuery({
    queryKey: ['summaries'],
    queryFn: () => getSummaries(),
  });

  const todaySummary = summaries[0];

  return (
    <div className="mobile-page mobile-page--chat im-page">
      <div className="chat-topbar im-topbar">
        <button type="button" className="icon-circle" onClick={() => navigate('/config')}>
          <LeftOutlined />
        </button>
        <div className="chat-topbar__title">
          <img src={getIcemanAvatar()} alt={config?.nickname ?? '小冰人'} className="chat-topbar__avatar" />
          <span>{config?.nickname}</span>
        </div>
        <button type="button" className="icon-circle" onClick={() => navigate('/records')}>
          <Badge count={todaySummary?.visitor_count ?? 0} size="small">
            <OrderedListOutlined />
          </Badge>
        </button>
      </div>

      <div className="chat-timestamp">刚刚</div>

      <div className="im-page__body">
        {todaySummary?.visitor_highlights.length ? (
          todaySummary.visitor_highlights.slice(0, 1).map((item) => (
            <div key={item.session_id} className="im-page__row">
              <img
                src={getIcemanAvatar()}
                alt={config?.nickname ?? '小冰人'}
                className="im-page__side-avatar"
              />
              <HighlightCard item={item} icemanName={config?.nickname ?? '小冰人'} />
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
        <input className="im-page__fake-input" value="发送消息" readOnly />
        <button type="button" className="icon-circle icon-circle--soft">
          ⌁
        </button>
        <button type="button" className="icon-circle icon-circle--soft">
          +
        </button>
      </div>
    </div>
  );
}
