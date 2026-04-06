import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Empty, Typography } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { getVisitorConversations } from '../api/service';
import { SessionListItem } from '../components/session-list-item';
import { useAppStore } from '../stores/app-store';

export function RecordsPage() {
  const navigate = useNavigate();
  const showFolded = useAppStore((state) => state.showFolded);
  const toggleFolded = useAppStore((state) => state.toggleFolded);

  const { data: activeConversations = [] } = useQuery({
    queryKey: ['visitor-conversations', 'active'],
    queryFn: () => getVisitorConversations(false),
  });

  const { data: allVisible = [] } = useQuery({
    queryKey: ['visitor-conversations', 'with-folded'],
    queryFn: () => getVisitorConversations(true),
  });

  const folded = allVisible.filter((item) => item.status === 'filtered_folded');

  return (
    <div className="mobile-page mobile-page--plain">
      <div className="mobile-header mobile-header--records">
        <Typography.Title level={2}>访客消息</Typography.Title>
        <Typography.Text>今天</Typography.Text>
      </div>

      <div className="records-page__content">
        {folded.length ? (
          <button type="button" className="records-folded-entry" onClick={toggleFolded}>
            <span>已被折叠的对话</span>
            {showFolded ? <UpOutlined /> : <DownOutlined />}
          </button>
        ) : null}

        {showFolded && folded.length ? (
          <div className="records-folded-list">
            {folded.map((item) => (
              <SessionListItem
                key={item.session_id}
                item={item}
                variant="records"
                onClick={() => navigate(`/host-chat/${item.session_id}`)}
              />
            ))}
          </div>
        ) : null}

        <div className="records-list">
        {activeConversations.length ? (
          activeConversations.map((item) => (
            <SessionListItem
              key={item.session_id}
              item={item}
              variant="records"
              onClick={() => navigate(`/host-chat/${item.session_id}`)}
            />
          ))
        ) : (
          <div className="empty-card">
            <Empty description="暂无访客对话" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
