import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ThesisForm() {
  const [form, setForm] = useState({
    title: '',
    abstract: '',
    career: '',
    keywords: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        keywords: form.keywords
          ? form.keywords.split(',').map((k) => k.trim()).filter(Boolean)
          : [],
      };
      const res = await api.post('/thesis', payload);
      toast.success('Tesis creada exitosamente');
      navigate(`/thesis/${res.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear tesis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Nueva Tesis / Trabajo de Grado</h1>
      </div>
      <div className="card" style={{ maxWidth: 700 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título *</label>
            <input
              type="text"
              name="title"
              className="form-control"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Título del trabajo de grado"
            />
          </div>
          <div className="form-group">
            <label>Resumen / Abstract</label>
            <textarea
              name="abstract"
              className="form-control"
              value={form.abstract}
              onChange={handleChange}
              placeholder="Descripción breve del trabajo..."
              rows={5}
            />
          </div>
          <div className="form-group">
            <label>Carrera</label>
            <input
              type="text"
              name="career"
              className="form-control"
              value={form.career}
              onChange={handleChange}
              placeholder="Ingeniería de Sistemas"
            />
          </div>
          <div className="form-group">
            <label>Palabras clave (separadas por coma)</label>
            <input
              type="text"
              name="keywords"
              className="form-control"
              value={form.keywords}
              onChange={handleChange}
              placeholder="IA, Machine Learning, Educación"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear Tesis'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
