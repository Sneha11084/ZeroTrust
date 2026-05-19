import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../api/axios';
import { useTheme } from '../context/ThemeContext';

function VerifyOtp() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600);

  useEffect(() => {
    const storedUserId = localStorage.getItem('otpUserId');
    if (!storedUserId) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(1, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const userId = localStorage.getItem('otpUserId');

    if (!userId) {
      setError('Unable to verify OTP without a login session.');
      setLoading(false);
      return;
    }

    if (!/^[0-9]{6}$/.test(otpCode)) {
      setError('Please enter the 6-digit code sent to your email.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/verify-otp', {
        userId,
        otpCode,
      });

      const { success, token } = response.data;

      if (success) {
        localStorage.setItem('zerotrust_token', token);
        localStorage.removeItem('otpUserId');
        navigate('/dashboard');
        return;
      }

      setError(response.data.message || 'Unable to verify OTP.');
    } catch (err) {
      setError(err?.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(event) {
    const rawValue = event.target.value.replace(/[^0-9]/g, '');
    setOtpCode(rawValue.slice(0, 6));
  }

  return (
    <div className={isDark ? 'min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-8' : 'min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center px-4 py-8'}>
      <motion.div
        className={isDark ? 'w-full max-w-md rounded-3xl bg-slate-900/90 p-10 shadow-2xl shadow-black/40 border border-slate-800' : 'w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl shadow-slate-200 border border-gray-200'}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="space-y-4 text-center">
          <div className={isDark ? 'mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/10 text-3xl text-white' : 'mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-3xl text-blue-700'}>
            🛡️
          </div>
          <h1 className={isDark ? 'text-3xl font-semibold text-white' : 'text-3xl font-semibold text-gray-900'}>Verify Your Identity</h1>
          <p className={isDark ? 'text-sm text-slate-400' : 'text-sm text-gray-500'}>Enter the 6-digit code sent to your email</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className={isDark ? 'block text-sm font-medium text-slate-300' : 'block text-sm font-medium text-gray-700'}>One-time password</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={otpCode}
              onChange={handleOtpChange}
              placeholder="123456"
              className={isDark ? 'mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950 px-5 py-4 text-center text-2xl tracking-[0.45em] text-white outline-none shadow-inner shadow-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'mt-3 w-full rounded-3xl border border-gray-300 bg-white px-5 py-4 text-center text-2xl tracking-[0.45em] text-gray-900 outline-none shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Code expires in {minutes}:{seconds}</p>
            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>{otpCode.length}/6 digits</p>
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
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link className={isDark ? 'text-blue-300 hover:text-blue-100' : 'text-blue-600 hover:text-blue-500'} to="/login">
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default VerifyOtp;
