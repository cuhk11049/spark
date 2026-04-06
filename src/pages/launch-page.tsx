import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, message } from 'antd';
import { updateConfig } from '../api/service';
import { Mascot } from '../components/mascot';

export function LaunchPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="mobile-page mobile-page--launch">
      <div className="launch-panel">
        <Mascot size="lg" />
        <Button
          type="primary"
          size="large"
          className="launch-button"
          loading={loading}
          onClick={async () => {
            setLoading(true);
            await updateConfig({ action: 'enable' });
            message.success('小冰人已开启');
            window.setTimeout(() => navigate('/config'), 800);
          }}
        >
          {loading ? '开启中' : '开启小冰人'}
        </Button>
      </div>
    </div>
  );
}
