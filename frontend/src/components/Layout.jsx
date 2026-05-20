import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationToast from './NotificationToast';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/admin': 'Admin Panel',
  '/admin/blocked': 'Blocked IPs',
  '/profile': 'My Profile',
};

function Layout({ children }) {
  const location = useLocation();
  const { theme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { notifications, removeNotification } = useSocket();

  const bgClass = theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-white text-slate-950';
  const headerClass = theme === 'dark' ? 'border-b border-white/10 bg-slate-950/80 text-slate-400' : 'border-b border-slate-200 bg-white text-slate-500';
  const pageTitle = pageTitles[location.pathname] || 'ZeroTrust';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="transition-all duration-300">
        <div className={`${headerClass} px-6 py-5 backdrop-blur-xl sm:px-8`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/20 bg-slate-900/80 text-lg text-white transition hover:bg-slate-900"
                onClick={() => setIsSidebarOpen(true)}
              >
                ☰
              </button>
              <div>
                <p className="text-sm uppercase tracking-[0.2em]">{pageTitle}</p>
                <h1 className="mt-2 text-2xl font-semibold">Welcome back to ZeroTrust</h1>
              </div>
            </div>
          </div>
        </div>

        <main className="px-6 py-8 sm:px-8">{children}</main>
      </div>
      <NotificationToast notifications={notifications} onDismiss={removeNotification} isDark={theme === 'dark'} />
    </div>
  );
}

export default Layout;
