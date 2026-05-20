import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useTheme } from '../context/ThemeContext';

function Profile() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordState, setPasswordState] = useState({ oldPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const profileRes = await axios.get('/api/user/profile');
        setProfile(profileRes.data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleLogout() {
    localStorage.removeItem('zerotrust_token');
    navigate('/login');
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();
    setMessage('Password change is not implemented yet. This form is ready for your next backend feature.');
  }

  const themeStyles = {
    page: isDark ? 'bg-slate-950 text-white' : 'bg-white text-gray-900',
    card: isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-900 shadow-md',
    panel: isDark ? 'bg-slate-900/80 text-white' : 'bg-white text-gray-900 shadow-md',
    border: isDark ? 'border-slate-700' : 'border-gray-200',
    mutedText: isDark ? 'text-slate-400' : 'text-gray-500',
    emphasized: isDark ? 'text-white' : 'text-gray-900',
    input: isDark ? 'border-slate-700 bg-slate-950 text-white placeholder:text-slate-500' : 'border-gray-300 bg-gray-50 text-gray-900 placeholder:text-gray-400',
    formMessage: isDark ? 'bg-slate-800/90 text-slate-200' : 'bg-slate-100 text-gray-900',
  };

  return (
    <div className={`min-h-screen px-6 py-8 sm:px-8 ${themeStyles.page}`}>
      <div className={`rounded-3xl border p-6 ${themeStyles.card} ${themeStyles.border} mb-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={`text-sm uppercase tracking-[0.25em] ${themeStyles.mutedText}`}>My Profile</p>
            <h1 className={`mt-2 text-3xl font-semibold break-all ${themeStyles.emphasized}`}>{profile?.email || 'ZeroTrust user'}</h1>
            <p className={`mt-2 text-sm ${themeStyles.mutedText}`}>Manage your account settings and preferences.</p>
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

      <div className="grid gap-5 md:grid-cols-2">
        <div className={`rounded-3xl border p-6 ${themeStyles.panel} ${themeStyles.border}`}>
          <h2 className={`text-xl font-semibold ${themeStyles.emphasized}`}>Account details</h2>
          <div className="mt-6 space-y-4">
            <div>
              <p className={`text-xs uppercase tracking-[0.2em] ${themeStyles.mutedText}`}>Email</p>
              <p className={`mt-2 text-lg font-medium break-all ${themeStyles.emphasized}`}>{profile?.email || 'Loading...'}</p>
            </div>
            <div>
              <p className={`text-xs uppercase tracking-[0.2em] ${themeStyles.mutedText}`}>Member since</p>
              <p className={`mt-2 text-lg font-medium ${themeStyles.emphasized}`}>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Loading...'}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-3xl border p-6 ${themeStyles.panel} ${themeStyles.border}`}>
          <h2 className={`text-xl font-semibold ${themeStyles.emphasized}`}>Change Password</h2>
          <p className={`mt-2 text-sm ${themeStyles.mutedText}`}>Secure your account by updating your password.</p>

          <form className="mt-6 space-y-4" onSubmit={handlePasswordSubmit}>
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>Old Password</label>
              <input
                type="password"
                value={passwordState.oldPassword}
                onChange={(e) => setPasswordState((prev) => ({ ...prev, oldPassword: e.target.value }))}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${themeStyles.input}`}
                required
              />
            </div>
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>New Password</label>
              <input
                type="password"
                value={passwordState.newPassword}
                onChange={(e) => setPasswordState((prev) => ({ ...prev, newPassword: e.target.value }))}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${themeStyles.input}`}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              Update Password
            </button>
          </form>

          {message && <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${themeStyles.formMessage}`}>{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default Profile;
