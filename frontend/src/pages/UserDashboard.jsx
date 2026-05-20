import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useTheme } from '../context/ThemeContext';

function UserDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const [profileRes, historyRes] = await Promise.all([
          axios.get('/api/user/profile'),
          axios.get('/api/user/my-history'),
        ]);

        setProfile(profileRes.data);
        setHistory(historyRes.data);
      } catch (err) {
        console.error('Failed to load user dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const averageRisk = useMemo(() => {
    if (!history.length) return 0;
    const total = history.reduce((sum, attempt) => sum + attempt.risk_score, 0);
    return Math.round(total / history.length);
  }, [history]);

  const securityScore = 100 - averageRisk;

  const warningMessage = useMemo(() => {
    if (history.length < 2) return '';
    const [latest, previous] = history;
    if (latest.ip_address !== previous.ip_address) {
      return `New location detected from ${latest.ip_address}. Please verify your recent login.`;
    }
    return '';
  }, [history]);

  function handleLogout() {
    localStorage.removeItem('zerotrust_token');
    navigate('/login');
  }

  const themeStyles = {
    page: isDark ? 'bg-slate-950 text-white' : 'bg-white text-gray-900',
    card: isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-900 shadow-md',
    panel: isDark ? 'bg-slate-900/80 text-white' : 'bg-white text-gray-900 shadow-md',
    border: isDark ? 'border-slate-700' : 'border-gray-200',
    mutedText: isDark ? 'text-slate-400' : 'text-gray-500',
    emphasized: isDark ? 'text-white' : 'text-gray-900',
    tableHeader: isDark ? 'bg-slate-900 text-slate-400' : 'bg-gray-50 text-gray-600',
    rowEven: isDark ? 'bg-slate-950' : 'bg-white',
    rowOdd: isDark ? 'bg-slate-900' : 'bg-gray-50',
  };

  return (
    <div className={`min-h-screen px-6 py-8 sm:px-8 ${themeStyles.page}`}>
      <div className={`rounded-3xl border p-6 ${themeStyles.card} ${themeStyles.border} mb-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={`text-sm uppercase tracking-[0.25em] ${themeStyles.mutedText}`}>Welcome back</p>
            <h1 className={`mt-2 text-3xl font-semibold break-all ${themeStyles.emphasized}`}>{profile?.email || 'ZeroTrust user'}</h1>
            <p className={`mt-2 text-sm ${themeStyles.mutedText}`}>Secure overview of your account activity.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
          >
            Logout
          </button>
        </div>
      </div>

      {warningMessage && (
        <div className="mb-5 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-900">
          <p className="font-semibold">⚠️ New location detected</p>
          <p className="mt-2 text-sm">{warningMessage}</p>
        </div>
      )}

      <div className={`rounded-3xl border p-6 ${themeStyles.panel} ${themeStyles.border} mb-5 max-w-2xl`}>
        <p className={`text-sm ${themeStyles.mutedText}`}>Personal security score</p>
        <div className="mt-6 flex items-end gap-6">
          <div className={`flex h-32 w-32 items-center justify-center rounded-full ${isDark ? 'bg-blue-500/10 text-white' : 'bg-blue-500/10 text-gray-900'} text-4xl font-semibold`}>
            {securityScore}
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${themeStyles.emphasized}`}>Score</h2>
            <p className={`mt-2 text-sm ${themeStyles.mutedText}`}>Based on your last 10 login attempts.</p>
          </div>
        </div>
      </div>

      <div className={`rounded-3xl border p-6 ${themeStyles.panel} ${themeStyles.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-semibold ${themeStyles.emphasized}`}>My Login History</h2>
            <p className={`mt-2 text-sm ${themeStyles.mutedText}`}>Recent login attempts from your account.</p>
          </div>
        </div>

        <div className={`mt-6 overflow-x-auto rounded-3xl border ${themeStyles.border}`}>
          <table className={`w-full min-w-[640px] divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'} text-left text-sm ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
            <thead className={themeStyles.tableHeader}>
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3">Device</th>
              </tr>
            </thead>
            <tbody>
              {history.map((attempt, index) => (
                <tr key={attempt.id} className={`${index % 2 === 0 ? themeStyles.rowEven : themeStyles.rowOdd}`}>
                  <td className="px-4 py-3">{new Date(attempt.timestamp).toLocaleString()}</td>
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
                  <td className="px-4 py-3 truncate max-w-[220px]">{attempt.user_agent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
