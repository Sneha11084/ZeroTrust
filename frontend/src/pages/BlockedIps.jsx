import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import axios from '../api/axios';
import { useTheme } from '../context/ThemeContext';

function BlockedIps() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [blockedIps, setBlockedIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [reason, setReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    async function loadBlockedIps() {
      try {
        const response = await axios.get('/api/admin/blocked-ips');
        setBlockedIps(response.data);
      } catch (err) {
        console.error('Error loading blocked IPs:', err);
        setError('Unable to load blocked IPs.');
      } finally {
        setLoading(false);
      }
    }

    loadBlockedIps();
  }, []);

  async function handleUnblock(id) {
    try {
      await axios.delete(`/api/admin/blocked-ips/${id}`);
      setBlockedIps((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Error unblocking IP:', err);
      setError('Unable to unblock IP.');
    }
  }

  const themeStyles = {
    page: isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900',
    card: isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-gray-900 border-gray-200 shadow-md',
    header: isDark ? 'bg-slate-800 text-gray-400 border-slate-700' : 'bg-white text-gray-600 border-gray-200',
    rowEven: isDark ? 'bg-slate-800 text-gray-300' : 'bg-white text-gray-700',
    rowOdd: isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-50 text-gray-700',
    emptyState: isDark ? 'bg-slate-800 text-white border border-slate-700' : 'bg-green-50 border border-green-200 text-gray-900',
  };

  return (
    <div className={`min-h-screen px-6 py-8 sm:px-8 ${themeStyles.page}`}>
      <div className={`rounded-3xl border p-5 shadow-xl ${themeStyles.card}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Blocked IPs</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Review and remove blocked addresses from the ZeroTrust system.</p>
          </div>
        </div>
      </div>

      <div className={`mt-6 rounded-3xl border p-5 shadow-xl ${themeStyles.card}`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-gray-900'}>Block IP Manually</h2>
            <p className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-500'}>Add a suspicious IP to the block list immediately.</p>
          </div>
        </div>
        <form
          className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto]"
          onSubmit={async (event) => {
            event.preventDefault();
            setError('');
            setBlocking(true);

            try {
              const response = await axios.post('/api/admin/block-ip', {
                ipAddress,
                reason,
              });

              setBlockedIps((current) => [response.data.blockedIp, ...current]);
              setIpAddress('');
              setReason('');
            } catch (err) {
              console.error('Error blocking IP manually:', err);
              setError(err?.response?.data?.message || 'Unable to block IP.');
            } finally {
              setBlocking(false);
            }
          }}
        >
          <input
            type="text"
            value={ipAddress}
            onChange={(event) => setIpAddress(event.target.value)}
            placeholder="IP address"
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
          />
          <input
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason"
            className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="submit"
            disabled={blocking}
            className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {blocking ? 'Blocking...' : 'Block IP'}
          </button>
        </form>
        {error && (
          <div className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <div key={index} className={`h-20 rounded-3xl p-4 animate-pulse ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-red-900">{error}</div>
      ) : blockedIps.length === 0 ? (
        <div className={`rounded-3xl border p-8 ${themeStyles.emptyState}`}>
          ✅ No blocked IPs
        </div>
      ) : (
        <div className={`overflow-hidden rounded-3xl border ${isDark ? 'border-slate-700 bg-slate-800 text-gray-300' : 'border-gray-200 bg-white text-gray-900 shadow-md'}`}>
          <div className={`grid grid-cols-[1.2fr_1fr_1fr_0.8fr] gap-4 border-b px-4 py-4 text-sm font-semibold ${themeStyles.header}`}>
            <span>IP Address</span>
            <span>Reason</span>
            <span>Blocked At</span>
            <span className="text-right">Action</span>
          </div>
          <AnimatePresence>
            {blockedIps.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`grid grid-cols-[1.2fr_1fr_1fr_0.8fr] gap-4 px-4 py-4 ${index % 2 === 0 ? themeStyles.rowEven : themeStyles.rowOdd} border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}
              >
                <span className="break-all">{item.ip_address}</span>
                <span>{item.reason || 'No reason provided'}</span>
                <span>{new Date(item.blocked_at).toLocaleString()}</span>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleUnblock(item.id)}
                    className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
                  >
                    Unblock
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default BlockedIps;
