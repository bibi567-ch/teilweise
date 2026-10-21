import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const categories = ['Desarrollo', 'Marketing', 'Diseño', 'Educación', 'Análisis de Datos', 'Productividad', 'Creatividad', 'Otro'];

export default function PromptForm() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    content: '',
    category: 'Desarrollo',
    tags: '',
    isPublic: true,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
      };
      const res = await api.post('/prompts', payload);
      toast.success('Prompt creado exitosamente');
      navigate(`/prompts/${res.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear prompt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Nuevo Prompt</h1>
      </div>
      <div className="card" style={{ maxWidth: 720 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título *</label>
            <input type="text" name="title" className="form-control" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Descripción breve</label>
            <input type="text" name="description" className="form-control" value={form.description} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Contenido del Prompt *</label>
            <textarea name="content" className="form-control" value={form.content} onChange={handleChange} required rows={8} placeholder="Escribe aquí el prompt completo..." />
          </div>
          <div className="form-group">
            <label>Categoría</label>
            <select name="category" className="form-control" value={form.category} onChange={handleChange}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Tags (separados por coma)</label>
            <input type="text" name="tags" className="form-control" value={form.tags} onChange={handleChange} placeholder="chatgpt, system-prompt, coding" />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="isPublic" checked={form.isPublic} onChange={handleChange} />
              Prompt público (visible para la comunidad)
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Publicar Prompt'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
