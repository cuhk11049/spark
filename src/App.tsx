import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/app-shell';
import { ConfigPage } from './pages/config-page';
import { HostChatPage } from './pages/host-chat-page';
import { ImPage } from './pages/im-page';
import { LaunchPage } from './pages/launch-page';
import { RecordsPage } from './pages/records-page';
import { VisitorChatPage } from './pages/visitor-chat-page';

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/launch" replace />} />
        <Route path="/launch" element={<LaunchPage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/im" element={<ImPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/host-chat/:id" element={<HostChatPage />} />
        <Route path="/visitor/chat" element={<VisitorChatPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
