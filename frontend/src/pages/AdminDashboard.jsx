import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import axios from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';

const decisionColors = {
  ALLOWED: '#22c55e',
  OTP_REQUIRED: '#facc15',
  BLOCKED: '#ef4444',
};

const countryFlags = {
  'United States': '🇺🇸',
  India: '🇮🇳',
  'United Kingdom': '🇬🇧',
  China: '🇨🇳',
  Russia: '🇷🇺',
  Germany: '🇩🇪',
  France: '🇫🇷',
  Brazil: '🇧🇷',
  Canada: '🇨🇦',
  Australia: '🇦🇺',
  Japan: '🇯🇵',
  Localhost: '🖥️',
  Unknown: '🌐',
};

const summaryCards = [
  { label: 'Total Logins', key: 'totalLogins', icon: '🔵' },
  { label: 'Safe Logins', key: 'safeLogins', icon: '🟢' },
  { label: 'Suspicious Logins', key: 'suspiciousLogins', icon: '🟡' },
  { label: 'Blocked Logins', key: 'blockedLogins', icon: '🔴' },
  { label: 'Avg Risk Score', key: 'avgRiskScore', icon: '🟣' },
  { label: 'Active Users', key: 'activeUsers', icon: '⚡' },
];

function formatDateLabel(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function AdminDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { socket, addNotification } = useSocket();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');

  const themeStyles = useMemo(
    () => ({
      page: isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900',
      card: isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900 shadow-md',
      cardBorder: isDark ? 'border-slate-700' : 'border-gray-200',
      cardSubtext: isDark ? 'text-gray-400' : 'text-gray-500',
      panel: isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900 shadow-md',
      panelBorder: isDark ? 'border-slate-700' : 'border-gray-200',
      chartTitle: isDark ? 'text-white' : 'text-gray-900',
      tableHeaderText: isDark ? 'text-gray-400' : 'text-gray-600',
      rowText: isDark ? 'text-gray-300' : 'text-gray-700',
      liveFeed: isDark ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-900',
      label: isDark ? 'text-gray-400' : 'text-gray-500',
      title: isDark ? 'text-white' : 'text-gray-900',
      bannerLow: isDark ? 'bg-green-900/30 border border-green-700 text-white' : 'bg-green-50 border border-green-200 text-gray-900',
      bannerMedium: isDark ? 'bg-amber-900/30 border border-amber-700 text-white' : 'bg-amber-50 border border-amber-200 text-gray-900',
      bannerHigh: isDark ? 'bg-red-900/30 border border-red-700 text-white' : 'bg-red-50 border border-red-200 text-gray-900',
    }),
    [isDark]
  );

  async function loadAllData() {
    try {
      setRefreshing(true);
      const [statsRes, chartRes, hourlyRes, attemptsRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/chart-data'),
        axios.get('/api/admin/hourly'),
        axios.get('/api/admin/recent-attempts'),
      ]);

      setStats(statsRes.data);
      setChartData(chartRes.data);
      setHourlyData(hourlyRes.data);
      setRecentAttempts(attemptsRes.data);
      setToast('Dashboard refreshed successfully');
      setTimeout(() => setToast(''), 2500);
    } catch (err) {
      console.error('Failed to refresh admin dashboard:', err);
      setToast('Unable to refresh dashboard');
      setTimeout(() => setToast(''), 2500);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewAttempt = (attempt) => {
      console.log('Received new_login_attempt:', attempt);

      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalLogins: prev.totalLogins + 1,
          safeLogins: prev.safeLogins + (attempt.decision === 'ALLOWED' ? 1 : 0),
          suspiciousLogins: prev.suspiciousLogins + (attempt.decision === 'OTP_REQUIRED' ? 1 : 0),
          blockedLogins: prev.blockedLogins + (attempt.decision === 'BLOCKED' ? 1 : 0),
        };
      });

      setRecentAttempts((current) => [
        {
          id: `socket-${Date.now()}`,
          ip_address: attempt.ipAddress,
          risk_score: attempt.riskScore,
          decision: attempt.decision,
          country: attempt.country,
          user_agent: attempt.userAgent || 'Real-time event',
          timestamp: attempt.timestamp,
        },
        ...current,
      ].slice(0, 20));
    };

    const handleThreatLevelChange = ({ level }) => {
      console.log('Received threat_level_change:', level);
      setStats((prev) => (prev ? { ...prev, threatLevel: level } : prev));
    };

    const handleNewBlockedIp = ({ ipAddress }) => {
      console.log('Received new_blocked_ip:', ipAddress);
    };

    socket.on('new_login_attempt', handleNewAttempt);
    socket.on('threat_level_change', handleThreatLevelChange);
    socket.on('new_blocked_ip', handleNewBlockedIp);

    return () => {
      socket.off('new_login_attempt', handleNewAttempt);
      socket.off('threat_level_change', handleThreatLevelChange);
      socket.off('new_blocked_ip', handleNewBlockedIp);
    };
  }, [socket, addNotification]);

  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Safe', value: stats.safeLogins, color: decisionColors.ALLOWED },
      { name: 'Suspicious', value: stats.suspiciousLogins, color: decisionColors.OTP_REQUIRED },
      { name: 'Blocked', value: stats.blockedLogins, color: decisionColors.BLOCKED },
    ];
  }, [stats]);

  const threatBanner = useMemo(() => {
    if (!stats) return null;
    if (stats.threatLevel === 'LOW') {
      return {
        label: 'SYSTEM SAFE',
        message: 'LOW THREAT',
        className: themeStyles.bannerLow,
      };
    }
    if (stats.threatLevel === 'MEDIUM') {
      return {
        label: 'ELEVATED RISK',
        message: 'MEDIUM THREAT',
        className: themeStyles.bannerMedium,
      };
    }
    return {
      label: 'CRITICAL ALERT',
      message: 'HIGH THREAT',
      className: themeStyles.bannerHigh,
      pulse: true,
    };
  }, [stats, themeStyles.bannerHigh, themeStyles.bannerLow, themeStyles.bannerMedium]);

  function exportCsv() {
    if (!recentAttempts.length) return;

    const headers = ['Time', 'IP Address', 'Risk Score', 'Decision', 'User Agent'];
    const rows = recentAttempts.map((attempt) => [
      new Date(attempt.timestamp).toLocaleString(),
      attempt.ip_address,
      attempt.risk_score,
      attempt.decision,
      attempt.user_agent,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recent_attempts.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className={isDark ? 'min-h-screen px-6 py-8 sm:px-8 bg-slate-900 text-white' : 'min-h-screen px-6 py-8 sm:px-8 bg-gray-50 text-gray-900'}>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={isDark ? 'fixed right-6 top-6 z-50 rounded-2xl border px-5 py-3 text-sm shadow-2xl shadow-black/30 bg-slate-900/90 text-white border-white/10' : 'fixed right-6 top-6 z-50 rounded-2xl border px-5 py-3 text-sm shadow-2xl shadow-black/30 bg-white text-gray-900 border-gray-200'}
        >
          {toast}
        </motion.div>
      )}

      <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
        {summaryCards.map((card) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={isDark ? 'rounded-3xl border p-5 bg-slate-800 text-white border-slate-700' : 'rounded-3xl border p-5 bg-white text-gray-900 shadow-md border-gray-200'}
          >
            <div className="flex items-center gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                {card.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-500'}>{card.label}</p>
                  {card.key === 'blockedLogins' && stats?.blockedLogins > 0 ? (
                    <span className="inline-flex h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                  ) : null}
                </div>
                <p className={isDark ? 'mt-2 text-3xl font-semibold text-white' : 'mt-2 text-3xl font-semibold text-gray-900'}>{stats ? stats[card.key] : '...'}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {stats && threatBanner && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-5 ${threatBanner.className} ${threatBanner.pulse ? 'animate-pulse' : ''}`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={isDark ? 'text-sm uppercase tracking-[0.2em] text-gray-400' : 'text-sm uppercase tracking-[0.2em] text-gray-500'}>{threatBanner.label}</p>
              <h2 className={isDark ? 'mt-2 text-2xl font-semibold text-white' : 'mt-2 text-2xl font-semibold text-gray-900'}>{threatBanner.message}</h2>
            </div>
            <div className={isDark ? 'rounded-2xl px-4 py-3 text-sm bg-slate-950/10 text-slate-100' : 'rounded-2xl px-4 py-3 text-sm bg-gray-50 text-gray-900'}>
              Last refresh: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <div className={isDark ? 'rounded-3xl border p-5 bg-slate-800 text-white border-slate-700' : 'rounded-3xl border p-5 bg-white text-gray-900 shadow-md border-gray-200'}>
          <div className="mb-4">
            <h3 className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-gray-900'}>Last 7 Days Login Trends</h3>
            <p className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-500'}>Data grouped by decision type.</p>
          </div>

          <div className={isDark ? 'h-[320px] rounded-3xl overflow-hidden bg-slate-800' : 'h-[320px] rounded-3xl overflow-hidden bg-white shadow-md'}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: isDark ? '#cbd5e1' : '#475569' }} tickLine={false} axisLine={false} tickFormatter={formatDateLabel} />
                <YAxis tick={{ fill: isDark ? '#cbd5e1' : '#475569' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderRadius: 12,
                    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                  }}
                  labelFormatter={(value) => `Date: ${formatDateLabel(value)}`}
                />
                <Line type="monotone" dataKey="ALLOWED" stroke={decisionColors.ALLOWED} strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="OTP_REQUIRED" stroke={decisionColors.OTP_REQUIRED} strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="BLOCKED" stroke={decisionColors.BLOCKED} strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={isDark ? 'rounded-3xl border p-5 bg-slate-800 text-white border-slate-700' : 'rounded-3xl border p-5 bg-white text-gray-900 shadow-md border-gray-200'}>
          <div className="mb-4">
            <h3 className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-gray-900'}>Risk Distribution</h3>
            <p className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-500'}>Safe, suspicious and blocked attempts.</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 min-h-[320px] md:h-[320px] md:flex-row md:items-start py-4 md:py-0">
            <ResponsiveContainer width="100%" height={260} minWidth={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={6}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderRadius: 12,
                    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <span className="inline-flex h-4 w-4 rounded-full" style={{ backgroundColor: entry.color }} />
                  <div>
                    <p className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-500'}>{entry.name}</p>
                    <p className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-gray-900'}>{entry.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={isDark ? 'rounded-3xl border p-5 bg-slate-800 text-white border-slate-700' : 'rounded-3xl border p-5 bg-white text-gray-900 shadow-md border-gray-200'}>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-gray-900'}>Hourly Attack Map</h3>
            <p className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-500'}>Peak login activity over the last 24 hours.</p>
          </div>
          <div className={isDark ? 'rounded-2xl px-4 py-2 text-sm bg-slate-950/10 text-slate-300' : 'rounded-2xl px-4 py-2 text-sm bg-gray-50 text-gray-700'}>
            Live updates delivered in real time
          </div>
        </div>

        <div className="h-[360px] rounded-3xl overflow-hidden bg-transparent">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: isDark ? '#cbd5e1' : '#475569' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: isDark ? '#cbd5e1' : '#475569' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderRadius: 12,
                  border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                }}
              />
              <Bar dataKey="count" fill={decisionColors.BLOCKED} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={isDark ? 'rounded-3xl border p-5 bg-slate-800 text-white border-slate-700' : 'rounded-3xl border p-5 bg-white text-gray-900 shadow-md border-gray-200'}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-gray-900'}>⚡ Live Threat Feed</h3>
              <p className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-500'}>Latest login attempts from your system.</p>
            </div>
            {recentAttempts.some((attempt) => attempt.decision === 'BLOCKED') && (
              <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-700">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                Blocked traffic detected
              </span>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {recentAttempts.slice(0, 10).map((attempt) => (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={isDark ? 'rounded-3xl border p-4 border-slate-700 bg-slate-700 text-gray-300' : 'rounded-3xl border p-4 border-gray-200 bg-gray-100 text-gray-700'}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-500'}>{new Date(attempt.timestamp).toLocaleString()}</p>
                      <p className={isDark ? 'mt-1 font-medium text-white' : 'mt-1 font-medium text-gray-900'}>{attempt.ip_address}</p>
                    </div>
                    <div className={isDark ? 'flex items-center gap-3 text-sm text-gray-300' : 'flex items-center gap-3 text-sm text-gray-700'}>
                      <span>Risk {attempt.risk_score}</span>
                      <span>{countryFlags[attempt.country] || '🌐'} {attempt.country || 'Unknown'}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        attempt.decision === 'ALLOWED'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : attempt.decision === 'OTP_REQUIRED'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-red-500/15 text-red-300'
                      }`}>
                        {attempt.decision}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className={isDark ? 'rounded-3xl border p-5 bg-slate-800 text-white border-slate-700' : 'rounded-3xl border p-5 bg-white text-gray-900 shadow-md border-gray-200'}>
          <div className="mb-4">
            <h3 className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-gray-900'}>Recent Attempts Table</h3>
            <p className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-500'}>Full detail view of the last login events.</p>
          </div>

          <div className={isDark ? 'overflow-x-auto rounded-3xl border bg-slate-800 border-slate-700' : 'overflow-x-auto rounded-3xl border bg-white shadow-md border-gray-200'}>
            <table className={isDark ? 'w-full min-w-[640px] divide-y divide-slate-700 text-left text-sm text-gray-300' : 'w-full min-w-[640px] divide-y divide-gray-200 text-left text-sm text-gray-700'}>
              <thead className={isDark ? 'bg-slate-800 text-gray-400' : 'bg-white text-gray-600'}>
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Decision</th>
                  <th className="px-4 py-3">Device</th>
                </tr>
              </thead>
              <tbody>
                {recentAttempts.map((attempt, index) => (
                  <tr
                    key={attempt.id}
                    className={index % 2 === 0 ? (isDark ? 'bg-slate-800 border-b border-slate-700' : 'bg-white border-b border-gray-200') : (isDark ? 'bg-slate-700 border-b border-slate-700' : 'bg-gray-50 border-b border-gray-200')}
                  >
                    <td className="px-4 py-3">{new Date(attempt.timestamp).toLocaleTimeString()}</td>
                    <td className="px-4 py-3">{attempt.ip_address}</td>
                    <td className="px-4 py-3">{attempt.risk_score}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        attempt.decision === 'ALLOWED'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : attempt.decision === 'OTP_REQUIRED'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-red-500/15 text-red-300'
                      }`}>
                        {attempt.decision}
                      </span>
                    </td>
                    <td className="px-4 py-3 truncate max-w-[240px]">{attempt.user_agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className={isDark ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-gray-900'}>Recent attempts export</h3>
          <p className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-500'}>Download the current feed as CSV for reporting.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center justify-center rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
        >
          📥 Export CSV
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;
