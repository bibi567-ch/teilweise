import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function ThesisDetail() {
  const { id } = useParams();
  const [thesis, setThesis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [versionForm, setVersionForm] = useState({ title: '', description: '', observations: '' });
  const [reviewForm, setReviewForm] = useState({ comments: '', score: '', decision: 'pendiente' });
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchThesis = async () => {
    try {
      const res = await api.get(`/thesis/${id}`);
      setThesis(res.data.data);
    } catch (err) {
      toast.error('Error al cargar tesis');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThesis();
  }, [id]);

  const handleAddVersion = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/thesis/${id}/versions`, versionForm);
      toast.success('Nueva versión agregada');
      setShowVersionForm(false);
      setVersionForm({ title: '', description: '', observations: '' });
      fetchThesis();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al agregar versión');
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/thesis/${id}/reviews`, {
        ...reviewForm,
        score: reviewForm.score ? Number(reviewForm.score) : undefined,
        version: thesis.currentVersion,
      });
      toast.success('Revisión enviada');
      setShowReviewForm(false);
      setReviewForm({ comments: '', score: '', decision: 'pendiente' });
      fetchThesis();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al enviar revisión');
    }
  };

  if (loading || !thesis) {
    return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Cargando...</div>;
  }

  const isOwner = user?.role === 'estudiante' && thesis.student?._id === user._id;
  const canReview = user?.role === 'tribunal' || user?.role === 'administrador';
  const canEdit = isOwner || user?.role === 'administrador';

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <button className="btn btn-sm btn-outline mb-2" onClick={() => navigate('/')}>
            ← Volver
          </button>
          <h1>{thesis.title}</h1>
          <span className={`badge badge-${thesis.status}`}>{statusLabel[thesis.status]}</span>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowVersionForm(!showVersionForm)}>
              + Nueva Versión
            </button>
          )}
          {canReview && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowReviewForm(!showReviewForm)}>
              Agregar Revisión
            </button>
          )}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div>
          <div className="card mb-2">
            <h3 style={{ marginBottom: '0.75rem' }}>Información general</h3>
            <p><strong>Estudiante:</strong> {thesis.student?.name} ({thesis.student?.email})</p>
            <p><strong>Carrera:</strong> {thesis.career || 'N/A'}</p>
            <p><strong>Versión actual:</strong> {thesis.currentVersion}</p>
            {thesis.finalGrade != null && <p><strong>Nota final:</strong> {thesis.finalGrade}</p>}
            {thesis.abstract && (
              <>
                <h4 className="mt-2">Resumen</h4>
                <p className="text-muted">{thesis.abstract}</p>
              </>
            )}
            {thesis.keywords?.length > 0 && (
              <p className="mt-1">
                <strong>Keywords:</strong> {thesis.keywords.join(', ')}
              </p>
            )}
          </div>

          {showVersionForm && (
            <div className="card mb-2">
              <h3>Nueva Versión</h3>
              <form onSubmit={handleAddVersion}>
                <div className="form-group">
                  <label>Título de la versión</label>
                  <input
                    className="form-control"
                    value={versionForm.title}
                    onChange={(e) => setVersionForm({ ...versionForm, title: e.target.value })}
                    placeholder={thesis.title}
                  />
                </div>
                <div className="form-group">
                  <label>Descripción de cambios</label>
                  <textarea
                    className="form-control"
                    value={versionForm.description}
                    onChange={(e) => setVersionForm({ ...versionForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Observaciones</label>
                  <textarea
                    className="form-control"
                    value={versionForm.observations}
                    onChange={(e) => setVersionForm({ ...versionForm, observations: e.target.value })}
                    rows={2}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Guardar versión</button>
              </form>
            </div>
          )}

          {showReviewForm && (
            <div className="card mb-2">
              <h3>Nueva Revisión (v{thesis.currentVersion})</h3>
              <form onSubmit={handleAddReview}>
                <div className="form-group">
                  <label>Comentarios *</label>
                  <textarea
                    className="form-control"
                    value={reviewForm.comments}
                    onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
                    required
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>Puntuación (0-100)</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    max={100}
                    value={reviewForm.score}
                    onChange={(e) => setReviewForm({ ...reviewForm, score: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Decisión</label>
                  <select
                    className="form-control"
                    value={reviewForm.decision}
                    onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value })}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="observado">Observado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-secondary btn-sm">Enviar revisión</button>
              </form>
            </div>
          )}

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Historial de Versiones</h3>
            {thesis.versions?.length === 0 ? (
              <p className="text-muted">Sin versiones</p>
            ) : (
              <ul className="status-list">
                {[...thesis.versions].reverse().map((v) => (
                  <li key={v._id || v.versionNumber}>
                    <div>
                      <strong>v{v.versionNumber}</strong> — {v.title}
                      <br />
                      <small className="text-muted">
                        {v.uploadedBy?.name} · {new Date(v.createdAt).toLocaleDateString('es')}
                      </small>
                      {v.description && <p style={{ fontSize: '0.9rem', marginTop: 4 }}>{v.description}</p>}
                    </div>
                    <span className={`badge badge-${v.status}`}>{statusLabel[v.status] || v.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <div className="card mb-2">
            <h3 style={{ marginBottom: '0.75rem' }}>Tribunal / Asesores</h3>
            <p><strong>Asesores:</strong></p>
            <ul style={{ marginLeft: '1.2rem', marginBottom: '0.75rem' }}>
              {thesis.advisors?.length > 0
                ? thesis.advisors.map((a) => <li key={a._id}>{a.name}</li>)
                : <li className="text-muted">Sin asignar</li>}
            </ul>
            <p><strong>Tribunal:</strong></p>
            <ul style={{ marginLeft: '1.2rem' }}>
              {thesis.tribunal?.length > 0
                ? thesis.tribunal.map((t) => <li key={t._id}>{t.name}</li>)
                : <li className="text-muted">Sin asignar</li>}
            </ul>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '0.75rem' }}>Revisiones</h3>
            {thesis.reviews?.length === 0 ? (
              <p className="text-muted">Sin revisiones aún</p>
            ) : (
              thesis.reviews.map((r, idx) => (
                <div key={r._id || idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div className="flex justify-between">
                    <strong>{r.reviewer?.name}</strong>
                    <span className={`badge badge-${r.decision}`}>{r.decision}</span>
                  </div>
                  <small className="text-muted">v{r.version} · {new Date(r.createdAt).toLocaleDateString('es')}</small>
                  {r.score != null && <p><strong>Nota:</strong> {r.score}</p>}
                  <p style={{ fontSize: '0.9rem', marginTop: 4 }}>{r.comments}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
