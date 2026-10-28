import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar() {
  const { therapist, logout } = useAuth();
  const navigate = useNavigate();

  if (!therapist) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-mist bg-white px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link to="/dashboard" className="font-display text-xl font-bold text-tide">
          Unfazed
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          {/* Changed to point to /dashboard */}
          <Link to="/dashboard" className="hover:text-tide">Profile</Link>
          <Link to="/dashboard/schedule" className="hover:text-tide">Schedule</Link>
          <Link to="/dashboard/clients" className="hover:text-tide">Clients</Link>
          <Link to="/dashboard/notes" className="hover:text-tide">Notes</Link>
          <Link to="/dashboard/payments" className="hover:text-tide">Payments</Link>
          <Link to="/dashboard/analytics" className="hover:text-tide">Analytics</Link>
          
          <button onClick={handleLogout} className="ml-4 rounded-lg border border-mist px-3 py-1.5 hover:bg-fog">
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}