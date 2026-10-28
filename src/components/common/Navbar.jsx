import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from './Button.jsx';

export default function Navbar() {
  const { therapist, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="border-b border-mist bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link to="/" className="font-display text-xl font-bold text-tide">Unfazed</Link>
        <div className="flex items-center gap-4">
          {therapist ? (
            <nav className="flex gap-4">
              <Link to="/dashboard" className="text-sm font-medium hover:text-tide">Profile</Link>
              <Link to="/dashboard/schedule" className="text-sm font-medium hover:text-tide">Schedule</Link>
              <Link to="/dashboard/clients" className="text-sm font-medium hover:text-tide">Clients</Link>
              <Link to="/dashboard/notes" className="text-sm font-medium hover:text-tide">Notes</Link>
              <Link to="/dashboard/payments" className="text-sm font-medium hover:text-tide">Payments</Link>
              <Link to="/dashboard/analytics" className="text-sm font-medium hover:text-tide">Analytics</Link>
              <Button variant="secondary" onClick={() => { logout(); navigate('/'); }}>Log out</Button>
            </nav>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium hover:text-tide">Log in</Link>
              <Link to="/register"><Button>Create account</Button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
