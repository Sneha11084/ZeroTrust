import { AnimatePresence, motion } from 'framer-motion';

const themeStyle = {
  blocked: 'border-red-500 bg-red-500/10 text-red-900',
  suspicious: 'border-yellow-400 bg-yellow-400/10 text-yellow-900',
  allowed: 'border-emerald-500 bg-emerald-500/10 text-emerald-900',
  default: 'border-slate-300 bg-slate-100 text-slate-900',
};

const iconMap = {
  blocked: '🚨',
  suspicious: '⚠️',
  allowed: '✅',
  default: '🔔',
};

function NotificationToast({ notifications, onDismiss, isDark }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-full max-w-md flex-col gap-3">
      <AnimatePresence initial={false}>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ duration: 0.25 }}
            className={`rounded-3xl border-l-4 p-4 shadow-2xl backdrop-blur-xl ${
              themeStyle[notification.type] || themeStyle.default
            } ${isDark ? 'bg-slate-900/90 text-white' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{iconMap[notification.type] || iconMap.default}</span>
                <div>
                  <p className="text-sm font-semibold">{notification.title || 'Security event'}</p>
                  <p className="mt-1 text-sm leading-6">{notification.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(notification.id)}
                className="rounded-full bg-white/10 px-2 py-1 text-sm hover:bg-white/20"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default NotificationToast;
