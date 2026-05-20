import { Routes, Route, Navigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import UserDashboard from './pages/UserDashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import BlockedIps from './pages/BlockedIps';
import VerifyOtp from './pages/VerifyOtp';
import Layout from './components/Layout';

function RequireAuth({ children }) {
  const token = localStorage.getItem('zerotrust_token') || localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem('zerotrust_token') || localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    if (decoded.email !== 'sv728318@gmail.com') {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  } catch (err) {
    return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Layout>
                <UserDashboard />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <RequireAuth>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </RequireAuth>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/blocked"
          element={
            <RequireAdmin>
              <RequireAuth>
                <Layout>
                  <BlockedIps />
                </Layout>
              </RequireAuth>
            </RequireAdmin>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Layout>
                <Profile />
              </Layout>
            </RequireAuth>
          }
        />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
