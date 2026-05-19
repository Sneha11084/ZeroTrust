import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../context/ThemeContext';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/admin': 'Admin Panel',
  '/admin/blocked': 'Blocked IPs',
  '/profile': 'My Profile',
};

function Layout({ children }) {
  const location = useLocation();
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [refreshIn, setRefreshIn] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshIn((prev) => (prev === 0 ? 30 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const bgClass = theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-white text-slate-950';
  const headerClass = theme === 'dark' ? 'border-b border-white/10 bg-slate-950/80 text-slate-400' : 'border-b border-slate-200 bg-white text-slate-500';
  const pageTitle = pageTitles[location.pathname] || 'ZeroTrust';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed((prev) => !prev)} />

      <div className={`ml-16 transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        <div className={`${headerClass} px-6 py-5 backdrop-blur-xl sm:px-8`}>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em]">{pageTitle}</p>
              <h1 className="mt-2 text-2xl font-semibold">Welcome back to ZeroTrust</h1>
            </div>
            <p className="text-sm">Refreshing in {refreshIn}s...</p>
          </div>
        </div>

        <main className="px-6 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
