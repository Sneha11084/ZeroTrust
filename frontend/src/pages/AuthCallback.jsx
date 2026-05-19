import { useEffect } from 'react';

function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('zerotrust_token', token);
      window.location.replace('/dashboard');
      return;
    }

    window.location.replace('/login?error=google_failed');
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-8">
      <div className="max-w-lg rounded-3xl border border-white/10 bg-slate-900/90 p-10 text-center shadow-2xl shadow-black/40">
        <div className="text-5xl">🔐</div>
        <h1 className="mt-6 text-2xl font-semibold">Signing you in...</h1>
        <p className="mt-4 text-sm text-slate-400">Please wait while we verify your Google account.</p>
      </div>
    </div>
  );
}

export default AuthCallback;
