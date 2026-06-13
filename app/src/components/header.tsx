import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import HistoryModal from './history';
import './styles/header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isHistoryOpen, setHistoryOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="logo-link">
          <h2>Rental App</h2>
        </Link>
      </div>

      <div className="header-right">
        {user?.role === 'user' && (
          <button className="btn-secondary" onClick={() => setHistoryOpen(true)}>
            Moja Historia
          </button>
        )}

        {user?.role === 'admin' && (
          <nav className="admin-nav">
            <Link to="/admin/stations" className="nav-link">Stacje</Link>
            <Link to="/admin/fleet" className="nav-link">Flota</Link>
            <Link to="/admin/history" className="nav-link">Historia Globalna</Link>
          </nav>
        )}

        <div className="user-info">
          <span className="username"><strong>{user?.username}</strong></span>
          <span className="role-badge">{user?.role}</span>
        </div>

        <button onClick={handleLogout} className="btn-logout">Wyloguj</button>
      </div>

      {isHistoryOpen && <HistoryModal isOpen={true} onClose={() => setHistoryOpen(false)} />}
    </header>
  );
}