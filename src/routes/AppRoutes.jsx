import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/common/Navbar.jsx';
import Loader from '../components/common/Loader.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import Dashboard from '../pages/therapist/Dashboard.jsx';
import PublicProfile from '../pages/client/PublicProfile.jsx';

function ProtectedRoute({ children }) {
  const { therapist, loading } = useAuth();
  if (loading) return <Loader />;
  return therapist ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        {/* Must stay last: matches any single-segment path as a therapist slug */}
        <Route path="/:slug" element={<PublicProfile />} />
      </Routes>
    </>
  );
}
