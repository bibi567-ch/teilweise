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
          ⚡ PromptVault
        </Link>
        <ul className="navbar-nav">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Explorar
            </Link>
          </li>
          <li>
            <Link to="/prompts/new" className={location.pathname === '/prompts/new' ? 'active' : ''}>
              Nuevo Prompt
            </Link>
          </li>
          <li style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
            {user?.name}
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
