import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Typography } from 'antd';

const navItems = [
  { key: '/launch', label: '开启' },
  { key: '/config', label: '配置' },
  { key: '/im', label: 'IM入口' },
  { key: '/records', label: '访客消息' },
  { key: '/visitor/chat', label: '访客聊天' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <div className="studio-toolbar">
        <div className="studio-toolbar__left">
          <Typography.Title level={4} className="brand-title">
            小冰人 Demo
          </Typography.Title>
          <Typography.Text className="brand-subtitle">
            按设计稿还原的移动端原型
          </Typography.Text>
        </div>
      </div>

      <div className="studio-nav">
        {navItems.map((item) => (
          <Button
            key={item.key}
            type={location.pathname === item.key ? 'primary' : 'default'}
            className="studio-nav__button"
            onClick={() => navigate(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="phone-stage">
        <div className="phone-shell">
          <div className="phone-shell__status">
            <span>9:41</span>
            <div className="phone-shell__icons">
              <span className="phone-shell__signal" />
              <span className="phone-shell__wifi" />
              <span className="phone-shell__battery" />
            </div>
          </div>
          <div className="page-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
