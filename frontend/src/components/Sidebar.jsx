import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/admin', label: 'Admin Panel', icon: '🛡️', adminOnly: true },
  { to: '/admin/blocked', label: 'Blocked IPs', icon: '🚫', adminOnly: true },
  { to: '/profile', label: 'My Profile', icon: '👤' },
];

function Sidebar({ isOpen, onClose }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-white text-slate-950 border-slate-200';
  const inactiveClass = isDark
    ? 'text-slate-300 hover:bg-white/10 hover:text-white'
    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950';

  let userEmail = '';

  try {
    const token = localStorage.getItem('token') || localStorage.getItem('zerotrust_token');
    if (token) {
      const decoded = jwtDecode(token);
      userEmail = decoded.email || '';
    }
  } catch (err) {
    console.log('Token decode failed:', err.message);
  }

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || userEmail === 'sv728318@gmail.com');

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <motion.div
        animate={{
          width: 240,
          x: isOpen ? 0 : -320,
        }}
        className={`${bgClass} fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r shadow-xl overflow-hidden md:z-30`}
        transition={{ duration: 0.25 }}
      >
        <div className="flex h-full flex-col justify-between px-3 py-5">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-500/15 text-2xl">
                🔐
              </div>
              <div>
                <p className="text-sm font-semibold">ZeroTrust</p>
                <p className="text-xs text-slate-400">Secure panel</p>
              </div>
            </div>

            <nav className="space-y-2">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/10' : inactiveClass
                    }`
                  }
                  onClick={onClose}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <ThemeToggle isCollapsed={false} />
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default Sidebar;
