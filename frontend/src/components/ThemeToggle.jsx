import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

function ThemeToggle({ isCollapsed = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileTap={{ scale: 0.95 }}
      title={isCollapsed ? label : undefined}
      aria-label={label}
      className={`flex items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-medium transition ${
        isCollapsed ? 'h-12 w-12' : 'h-12 w-full'
      } ${
        isDark
          ? 'border-slate-600 bg-slate-900 text-white hover:border-slate-400'
          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400'
      }`}
    >
      <span>{isDark ? '🌞' : '🌙'}</span>
      {!isCollapsed && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
    </motion.button>
  );
}

export default ThemeToggle;
