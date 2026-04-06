import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Switch, Typography, message } from 'antd';
import {
  DownOutlined,
  PlusOutlined,
  SettingOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { getBlacklist, getConfig, updateConfig } from '../api/service';
import { Mascot } from '../components/mascot';
import { useAppStore } from '../stores/app-store';

export function ConfigPage() {
  const queryClient = useQueryClient();
  const blacklistCollapsed = useAppStore((state) => state.blacklistCollapsed);
  const toggleBlacklist = useAppStore((state) => state.toggleBlacklist);
  const { data: config } = useQuery({ queryKey: ['config'], queryFn: getConfig });
  const { data: blackUsers = [] } = useQuery({
    queryKey: ['blacklist'],
    queryFn: getBlacklist,
  });

  const [closeOpen, setCloseOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: updateConfig,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['config'] });
      await queryClient.invalidateQueries({ queryKey: ['owner-entry'] });
      await queryClient.invalidateQueries({ queryKey: ['visitor-conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['conversation'] });
      await queryClient.invalidateQueries({ queryKey: ['messages'] });
      await queryClient.invalidateQueries({ queryKey: ['summaries'] });
    },
  });

  if (!config) {
    return null;
  }

  const disabled = config.status === 'disabled';

  return (
    <div className="mobile-page mobile-page--iced">
      <div className="mobile-header">
        <Typography.Title level={2}>{config.nickname}</Typography.Title>
      </div>

      <div className="mobile-scroll">
        <div className={`mobile-section stack-md ${disabled ? 'content-disabled' : ''}`}>
          <div className="iceman-card">
            <div className="iceman-card__art">
              <Mascot size="md" />
              <div className="speech-bubble speech-bubble--config">
                你好呀！我是你的小冰人，随时准备和你聊天～
              </div>
            </div>
            <Button block className="primary-soft-button" disabled>
              更换人设
            </Button>
          </div>

          <div className="white-card">
            <div className="section-head">
              <div>
                <div className="section-title">对话过滤</div>
                <div className="section-desc">
                  打扰信息会被折叠，广告导流会直接屏蔽，主人只看值得继续的人。
                </div>
              </div>
              <button type="button" className="ghost-icon-button" onClick={toggleBlacklist}>
                {blacklistCollapsed ? <DownOutlined /> : <UpOutlined />}
              </button>
            </div>
            {!blacklistCollapsed ? (
              <>
                <div className="divider-line" />
                <div className="filter-row">
                  <div className="filter-row__left">
                    <span className="new-pill">MVP</span>
                    <span className="filter-title">黑名单管理</span>
                    <SettingOutlined className="filter-setting" />
                  </div>
                  <button type="button" className="add-user-button">
                    <PlusOutlined />
                    添加用户
                  </button>
                </div>
                <div className="blacklist-list">
                  {blackUsers.map((user) => (
                    <div key={user.open_id} className="blacklist-item">
                      <img
                        src={user.avatarUrl}
                        alt={user.nickName}
                        className="blacklist-item__avatar"
                      />
                      <div className="blacklist-item__text">
                        <span>{user.nickName}</span>
                        <Typography.Text type="secondary">{user.city}</Typography.Text>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="white-card service-switch-card">
          <div>
            <div className="service-switch-card__label">服务开关</div>
            <Typography.Text type="secondary">
              {config.status === 'enabled' ? '访客可继续和小冰人发起对话' : '访客入口将暂停回复'}
            </Typography.Text>
          </div>
          <Switch
            checked={config.status === 'enabled'}
            onChange={(checked) => {
              if (!checked) {
                setCloseOpen(true);
                return;
              }

              void updateMutation.mutateAsync({ action: 'enable' }).then(() => {
                message.success('小冰人已重新开启');
              });
            }}
          />
        </div>
      </div>

      <Modal
        open={closeOpen}
        footer={null}
        closable={false}
        centered
        onCancel={() => setCloseOpen(false)}
      >
        <div className="sheet-confirm">
          <div className="sheet-confirm__mascot">
            <Mascot size="sm" sad />
          </div>
          <Typography.Title level={2}>确认关闭服务</Typography.Title>
          <Typography.Paragraph>
            关闭后，访客将无法继续触发自动回复；历史会话、总结卡片和接管记录仍会保留。
          </Typography.Paragraph>
          <div className="dialog-actions">
            <Button size="large" onClick={() => setCloseOpen(false)}>
              取消
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={() => {
                void updateMutation.mutateAsync({ action: 'disable' }).then(() => {
                  setCloseOpen(false);
                  message.success('小冰人已关闭');
                });
              }}
            >
              确认关闭
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
