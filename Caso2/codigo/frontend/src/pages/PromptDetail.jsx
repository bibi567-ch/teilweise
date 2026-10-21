import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function PromptDetail() {
  const { id } = useParams();
  const [prompt, setPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [versionForm, setVersionForm] = useState({ content: '', changeLog: '' });
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchPrompt = async () => {
    try {
      const res = await api.get(`/prompts/${id}`);
      setPrompt(res.data.data);
    } catch (err) {
      toast.error('Error al cargar prompt');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompt();
  }, [id]);

  const handleVote = async (value) => {
    try {
      const res = await api.post(`/prompts/${id}/vote`, { value });
      setPrompt((prev) => ({ ...prev, score: res.data.data.score, likesCount: res.data.data.likesCount }));
      toast.success(value === 1 ? '¡Like registrado!' : 'Voto registrado');
    } catch (err) {
      toast.error('Error al votar');
    }
  };

  const handleAddVersion = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/prompts/${id}/versions`, versionForm);
      toast.success('Nueva versión agregada');
      setShowVersionForm(false);
      setVersionForm({ content: '', changeLog: '' });
      fetchPrompt();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  if (loading || !prompt) {
    return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Cargando...</div>;
  }

  const isOwner = prompt.author?._id === user?._id || user?.role === 'administrador';

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <button className="btn btn-sm btn-outline mb-2" onClick={() => navigate('/')}>← Volver</button>
          <h1>{prompt.title}</h1>
          <span className="badge badge-enviado">{prompt.category}</span>
          {!prompt.isPublic && <span className="badge badge-borrador" style={{ marginLeft: 8 }}>Privado</span>}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => handleVote(1)}>👍 Like ({prompt.likesCount})</button>
          <button className="btn btn-outline btn-sm" onClick={() => handleVote(-1)}>👎</button>
          {isOwner && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowVersionForm(!showVersionForm)}>
              + Nueva Versión
            </button>
          )}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div>
          <div className="card mb-2">
            <h3 style={{ marginBottom: '0.75rem' }}>Contenido del Prompt (v{prompt.currentVersion})</h3>
            <pre style={{
              background: '#0f172a',
              color: '#e2e8f0',
              padding: '1.25rem',
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              overflowX: 'auto',
            }}>
              {prompt.content}
            </pre>
            <button
              className="btn btn-sm btn-outline mt-2"
              onClick={() => {
                navigator.clipboard.writeText(prompt.content);
                toast.success('Copiado al portapapeles');
              }}
            >
              📋 Copiar
            </button>
          </div>

          {showVersionForm && (
            <div className="card mb-2">
              <h3>Nueva Versión</h3>
              <form onSubmit={handleAddVersion}>
                <div className="form-group">
                  <label>Contenido actualizado *</label>
                  <textarea
                    className="form-control"
                    value={versionForm.content}
                    onChange={(e) => setVersionForm({ ...versionForm, content: e.target.value })}
                    required
                    rows={6}
                  />
                </div>
                <div className="form-group">
                  <label>Changelog</label>
                  <input
                    className="form-control"
                    value={versionForm.changeLog}
                    onChange={(e) => setVersionForm({ ...versionForm, changeLog: e.target.value })}
                    placeholder="Qué cambió en esta versión..."
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Guardar versión</button>
              </form>
            </div>
          )}

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Historial de Versiones</h3>
            <ul className="status-list">
              {[...prompt.versions].reverse().map((v) => (
                <li key={v._id || v.versionNumber}>
                  <div>
                    <strong>v{v.versionNumber}</strong>
                    <br />
                    <small className="text-muted">
                      {v.createdBy?.name} · {new Date(v.createdAt).toLocaleDateString('es')}
                    </small>
                    {v.changeLog && <p style={{ fontSize: '0.9rem', marginTop: 4 }}>{v.changeLog}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className="card mb-2">
            <h3 style={{ marginBottom: '0.75rem' }}>Información</h3>
            <p><strong>Autor:</strong> {prompt.author?.name}</p>
            <p><strong>Score:</strong> {prompt.score}</p>
            <p><strong>Vistas:</strong> {prompt.views}</p>
            <p><strong>Versión actual:</strong> {prompt.currentVersion}</p>
            {prompt.description && (
              <>
                <h4 className="mt-2">Descripción</h4>
                <p className="text-muted">{prompt.description}</p>
              </>
            )}
            {prompt.tags?.length > 0 && (
              <div className="mt-2">
                <strong>Tags:</strong>
                <div className="mt-1">
                  {prompt.tags.map((t) => (
                    <span key={t} style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 4, marginRight: 4, fontSize: '0.8rem' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
