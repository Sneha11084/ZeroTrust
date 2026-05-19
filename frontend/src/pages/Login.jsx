import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { decision, token, message, userId } = response.data;

      if (decision === 'ALLOWED') {
        localStorage.setItem('zerotrust_token', token);
        navigate('/dashboard');
        return;
      }

      if (decision === 'OTP_REQUIRED') {
        if (userId) {
          localStorage.setItem('otpUserId', userId);
        }
        navigate('/verify-otp');
        return;
      }

      if (decision === 'BLOCKED') {
        setError('Access blocked: suspicious activity detected.');
        return;
      }

      setError(message || 'Login failed. Please try again.');
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      setError(serverMessage || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-8">
      <motion.div
        className="w-full max-w-md rounded-3xl bg-white/5 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-3xl">
            🔒
          </div>
          <h1 className="text-3xl font-semibold text-white">ZeroTrust</h1>
          <p className="text-sm text-slate-400">Login securely and protect your account.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Don’t have an account?{' '}
          <Link to="/register" className="font-medium text-white hover:text-blue-300">
            Register
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
