import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BlockedIps from './pages/BlockedIps';
import VerifyOtp from './pages/VerifyOtp';
import Layout from './components/Layout';

function RequireAuth({ children }) {
  const token = localStorage.getItem('zerotrust_token');
  return token ? children : <Navigate to="/login" replace />;
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
            <RequireAuth>
              <Layout>
                <AdminDashboard />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/blocked"
          element={
            <RequireAuth>
              <Layout>
                <BlockedIps />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Layout>
                <UserDashboard />
              </Layout>
            </RequireAuth>
          }
        />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
