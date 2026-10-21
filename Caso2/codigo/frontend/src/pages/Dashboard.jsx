import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const categories = ['Todas', 'Desarrollo', 'Marketing', 'Diseño', 'Educación', 'Análisis de Datos', 'Productividad', 'Creatividad', 'Otro'];

export default function Dashboard() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Todas');
  const [search, setSearch] = useState('');

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category && category !== 'Todas') params.category = category;
      if (search) params.search = search;
      const res = await api.get('/prompts', { params });
      setPrompts(res.data.data);
    } catch (err) {
      toast.error('Error al cargar prompts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPrompts();
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Explorar Prompts</h1>
          <p className="text-muted">Repositorio colaborativo de ingeniería de prompts para LLMs</p>
        </div>
        <Link to="/prompts/new" className="btn btn-primary">
          + Nuevo Prompt
        </Link>
      </div>

      <div className="card mb-2" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <button type="submit" className="btn btn-primary btn-sm">Buscar</button>
        </form>
        <select
          className="form-control"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ maxWidth: 180 }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: '3rem' }}>Cargando prompts...</div>
      ) : prompts.length === 0 ? (
        <div className="card empty-state">
          <h3>No se encontraron prompts</h3>
          <p>Sé el primero en contribuir con un prompt de calidad.</p>
          <Link to="/prompts/new" className="btn btn-primary mt-2">Crear prompt</Link>
        </div>
      ) : (
        <div className="grid grid-2">
          {prompts.map((p) => (
            <Link key={p._id} to={`/prompts/${p._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{p.title}</h3>
                  <span className="badge badge-enviado">{p.category}</span>
                </div>
                <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  {p.description ? p.description.substring(0, 100) + (p.description.length > 100 ? '...' : '') : p.content.substring(0, 100) + '...'}
                </p>
                <div className="flex justify-between items-center" style={{ fontSize: '0.85rem' }}>
                  <span className="text-muted">por {p.author?.name}</span>
                  <span>
                    ⭐ {p.score} · 👁 {p.views} · v{p.currentVersion}
                    {!p.isPublic && ' · 🔒'}
                  </span>
                </div>
                {p.tags?.length > 0 && (
                  <div className="mt-1" style={{ fontSize: '0.8rem' }}>
                    {p.tags.slice(0, 4).map((t) => (
                      <span key={t} style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 4, marginRight: 4 }}>
                        {t}
                      </span>
                    ))}
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
