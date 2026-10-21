import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusLabel = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  observado: 'Observado',
  finalizado: 'Finalizado',
};

export default function Dashboard() {
  const [theses, setTheses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTheses = async () => {
      try {
        const res = await api.get('/thesis');
        setTheses(res.data.data);
      } catch (err) {
        toast.error('Error al cargar tesis');
      } finally {
        setLoading(false);
      }
    };
    fetchTheses();
  }, []);

  if (loading) {
    return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Cargando tesis...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">
            {user?.role === 'estudiante' && 'Mis tesis y trabajos de grado'}
            {user?.role === 'tribunal' && 'Tesis asignadas para revisión'}
            {user?.role === 'administrador' && 'Todas las tesis del sistema'}
          </p>
        </div>
        {(user?.role === 'estudiante' || user?.role === 'administrador') && (
          <Link to="/thesis/new" className="btn btn-primary">
            + Nueva Tesis
          </Link>
        )}
      </div>

      {theses.length === 0 ? (
        <div className="card empty-state">
          <h3>No hay tesis registradas</h3>
          <p>Comienza creando tu primer trabajo de grado.</p>
          {(user?.role === 'estudiante' || user?.role === 'administrador') && (
            <Link to="/thesis/new" className="btn btn-primary mt-2">
              Crear tesis
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-2">
          {theses.map((thesis) => (
            <Link key={thesis._id} to={`/thesis/${thesis._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{thesis.title}</h3>
                  <span className={`badge badge-${thesis.status}`}>{statusLabel[thesis.status] || thesis.status}</span>
                </div>
                <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  {thesis.abstract ? thesis.abstract.substring(0, 120) + (thesis.abstract.length > 120 ? '...' : '') : 'Sin resumen'}
                </p>
                <div className="flex justify-between items-center" style={{ fontSize: '0.85rem' }}>
                  <span className="text-muted">
                    Estudiante: {thesis.student?.name || 'N/A'}
                  </span>
                  <span className="text-muted">v{thesis.currentVersion}</span>
                </div>
                {thesis.finalGrade != null && (
                  <div className="mt-1">
                    <strong>Nota final: {thesis.finalGrade}</strong>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
