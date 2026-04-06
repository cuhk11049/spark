import { Button, Card, Space, Typography } from 'antd';
import type { PersonaTemplate } from '../types/models';

export function PersonaCard({
  item,
  selected,
  disabled,
  onSelect,
}: {
  item: PersonaTemplate;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <Card className={`persona-card ${selected ? 'is-selected' : ''}`}>
      <Space direction="vertical" size={8}>
        <Typography.Title level={5} className="persona-title">
          {item.name}
        </Typography.Title>
        <Typography.Text type="secondary">{item.description}</Typography.Text>
        <div className="persona-tagline">示例回复</div>
        <Typography.Paragraph className="persona-preview">
          {item.example_dialogue}
        </Typography.Paragraph>
        <Button type={selected ? 'primary' : 'default'} disabled={disabled} onClick={onSelect} block>
          {selected ? '当前人设' : '切换到该人设'}
        </Button>
      </Space>
    </Card>
  );
}
