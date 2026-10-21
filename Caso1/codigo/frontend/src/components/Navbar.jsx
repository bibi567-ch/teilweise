import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          📚 EducaVault
        </Link>
        <ul className="navbar-nav">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Dashboard
            </Link>
          </li>
          {(user?.role === 'estudiante' || user?.role === 'administrador') && (
            <li>
              <Link to="/thesis/new" className={location.pathname === '/thesis/new' ? 'active' : ''}>
                Nueva Tesis
              </Link>
            </li>
          )}
          <li style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
            {user?.name} ({user?.role})
          </li>
          <li>
            <button className="btn btn-outline btn-sm" onClick={handleLogout} style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>
              Cerrar sesión
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
