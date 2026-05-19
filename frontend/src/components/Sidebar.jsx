import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/admin', label: 'Admin Panel', icon: '🛡️' },
  { to: '/admin/blocked', label: 'Blocked IPs', icon: '🚫' },
  { to: '/profile', label: 'My Profile', icon: '👤' },
];

function Sidebar({ isCollapsed, toggleCollapse }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-white text-slate-950 border-slate-200';
  const inactiveClass = isDark
    ? 'text-slate-300 hover:bg-white/10 hover:text-white'
    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950';

  return (
    <motion.div
      animate={{ width: isCollapsed ? 64 : 240 }}
      className={`${bgClass} fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r shadow-xl overflow-hidden`}
      transition={{ duration: 0.25 }}
    >
      <div className="flex h-full flex-col justify-between px-3 py-5">
        <div className="space-y-6">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-500/15 text-2xl">
              🔐
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-semibold">ZeroTrust</p>
                <p className="text-xs text-slate-400">Secure panel</p>
              </div>
            )}
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/10' : inactiveClass
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={`space-y-4 ${isCollapsed ? 'items-center' : ''}`}>
          <ThemeToggle isCollapsed={isCollapsed} />
          <button
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex h-12 w-full items-center justify-center rounded-2xl border border-slate-300/20 bg-slate-100/10 px-3 text-sm text-slate-200 transition hover:bg-slate-100/20"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default Sidebar;
