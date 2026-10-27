import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/common/Navbar.jsx';
import Loader from '../components/common/Loader.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import Dashboard from '../pages/therapist/Dashboard.jsx';
import Schedule from '../pages/therapist/Schedule.jsx';
import PublicProfile from '../pages/client/PublicProfile.jsx';
import BookingPage from '../pages/client/BookingPage.jsx';
import Clients from '../pages/therapist/Clients.jsx';
import ClientProfile from '../pages/therapist/ClientProfile.jsx';
import ClientPortal from '../pages/client/ClientPortal.jsx';
import Payments from '../pages/therapist/Payments.jsx';
import Notes from '../pages/therapist/Notes.jsx';

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
        <Route path="/dashboard/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
        <Route path="/dashboard/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
        <Route path="/dashboard/clients/:id" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
        <Route path="/dashboard/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        <Route path="/dashboard/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
        <Route path="/portal/:token" element={<ClientPortal />} />
        <Route path="/:slug/book" element={<BookingPage />} />
        {/* Must stay last: matches any single-segment path as a therapist slug */}
        <Route path="/:slug" element={<PublicProfile />} />
      </Routes>
    </>
  );
}
