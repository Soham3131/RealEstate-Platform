import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../apiConfig';
import { Plus, Edit3, Trash2, Save, X, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Buying', 'Selling', 'Renting', 'Investment', 'Market Trends', 'Legal', 'Maintenance', 'Lifestyle'];

const EMPTY_FORM = {
  title: '',
  excerpt: '',
  content: '',
  category: 'Market Trends',
  tags: '',
  keywords: '',
  author: '',
  coverImage: '',
  readTime: 5,
  published: true,
  seoTitle: '',
  seoDescription: '',
};

const AdminArticles = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchesCategory = category === 'All' || a.category === category;
      const matchesSearch =
        !search ||
        String(a.title || '').toLowerCase().includes(search.toLowerCase()) ||
        String(a.excerpt || '').toLowerCase().includes(search.toLowerCase()) ||
        String(a.slug || '').toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [articles, search, category]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.get(`${API_BASE_URL}/articles/admin/all?limit=200&page=1`);
      setArticles(data.articles || []);
    } catch (err) {
      console.error('Error fetching admin articles:', err);
      setError(err.response?.data?.message || 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchArticles();
    } else {
      setLoading(false);
      setError('Only admins can manage articles.');
    }
  }, [isAdmin]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setMessage('');
    setError('');
  };

  const openEdit = (article) => {
    setEditingId(article._id);
    setForm({
      title: article.title || '',
      excerpt: article.excerpt || '',
      content: article.content || '',
      category: article.category || 'Market Trends',
      tags: Array.isArray(article.tags) ? article.tags.join(', ') : '',
      keywords: Array.isArray(article.keywords) ? article.keywords.join(', ') : '',
      author: article.author || '',
      coverImage: article.coverImage || '',
      readTime: article.readTime || 5,
      published: Boolean(article.published),
      seoTitle: article.seoTitle || '',
      seoDescription: article.seoDescription || '',
    });
    setShowForm(true);
    setMessage('');
    setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const saveArticle = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setMessage('');

      const payload = {
        ...form,
        readTime: Number(form.readTime) || 5,
      };

      if (editingId) {
        await axios.put(`${API_BASE_URL}/articles/${editingId}`, payload);
        setMessage('Article updated successfully.');
      } else {
        await axios.post(`${API_BASE_URL}/articles`, payload);
        setMessage('Article created successfully.');
      }

      closeForm();
      await fetchArticles();
    } catch (err) {
      console.error('Error saving article:', err);
      setError(err.response?.data?.message || 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (article) => {
    try {
      await axios.put(`${API_BASE_URL}/articles/${article._id}`, {
        published: !article.published,
      });
      await fetchArticles();
    } catch (err) {
      console.error('Error updating publish status:', err);
      setError(err.response?.data?.message || 'Failed to update publish status');
    }
  };

  const deleteArticle = async (article) => {
    const shouldDelete = window.confirm(`Delete article "${article.title}"?`);
    if (!shouldDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/articles/${article._id}`);
      setMessage('Article deleted successfully.');
      await fetchArticles();
    } catch (err) {
      console.error('Error deleting article:', err);
      setError(err.response?.data?.message || 'Failed to delete article');
    }
  };

  return (
    <div style={{ color: 'var(--text)', padding: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.35rem' }}>Article Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Create, edit, publish, and manage blog articles displayed on the public site.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button onClick={fetchArticles} style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', padding: '0.55rem 0.85rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={openCreate} style={{ border: 'none', background: 'var(--primary)', color: '#0F172A', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Plus size={16} /> New Article
          </button>
        </div>
      </div>

      {(message || error) && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 0.9rem', borderRadius: '8px', border: `1px solid ${error ? '#ef4444' : '#22c55e'}`, background: error ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: error ? '#ef4444' : '#16a34a' }}>
          {error || message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search by title, slug, excerpt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.7rem 0.85rem' }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.7rem 0.85rem' }}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={saveArticle} style={{ border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--surface)', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{editingId ? 'Edit Article' : 'Create Article'}</h3>
            <button type="button" onClick={closeForm} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <input placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required style={{ background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.8rem' }} />
            <input placeholder="Author" value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} style={{ background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.8rem' }} />
            <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} style={{ background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.8rem' }}>
              {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
            <input type="number" min="1" placeholder="Read time (minutes)" value={form.readTime} onChange={(e) => setForm((p) => ({ ...p, readTime: e.target.value }))} style={{ background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.8rem' }} />
          </div>

          <input placeholder="Cover image URL" value={form.coverImage} onChange={(e) => setForm((p) => ({ ...p, coverImage: e.target.value }))} style={{ width: '100%', marginBottom: '0.75rem', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.8rem' }} />
          <textarea placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} required rows={3} style={{ width: '100%', marginBottom: '0.75rem', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.8rem', resize: 'vertical' }} />
          <textarea placeholder="Article content" value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} required rows={8} style={{ width: '100%', marginBottom: '0.75rem', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.8rem', resize: 'vertical' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <input placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} style={{ background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.8rem' }} />
            <input placeholder="Keywords (comma separated)" value={form.keywords} onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))} style={{ background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.8rem' }} />
            <input placeholder="SEO title" value={form.seoTitle} onChange={(e) => setForm((p) => ({ ...p, seoTitle: e.target.value }))} style={{ background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.8rem' }} />
            <input placeholder="SEO description" value={form.seoDescription} onChange={(e) => setForm((p) => ({ ...p, seoDescription: e.target.value }))} style={{ background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.8rem' }} />
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontSize: '0.9rem', marginBottom: '0.8rem' }}>
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))} />
            Published
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
            <button type="button" onClick={closeForm} style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', borderRadius: '8px', padding: '0.55rem 0.9rem', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ border: 'none', background: 'var(--primary)', color: '#0F172A', borderRadius: '8px', padding: '0.55rem 0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, opacity: saving ? 0.75 : 1 }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Article'}
            </button>
          </div>
        </form>
      )}

      <div style={{ border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--surface)', overflow: 'hidden' }}>
       <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: '720px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr 100px 110px 180px', gap: '0.6rem', padding: '0.75rem 0.9rem', borderBottom: '1px solid var(--border)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          <div>Article</div>
          <div>Category</div>
          <div>Status</div>
          <div>Views</div>
          <div>Actions</div>
        </div>

        {loading ? (
          <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading articles...</div>
        ) : filteredArticles.length === 0 ? (
          <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No articles found.</div>
        ) : (
          filteredArticles.map((article) => (
            <div key={article._id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr 100px 110px 180px', gap: '0.6rem', padding: '0.8rem 0.9rem', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.15rem' }}>{article.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{article.slug}</div>
              </div>
              <div style={{ color: 'var(--text)' }}>{article.category}</div>
              <div>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.45rem', borderRadius: '999px', background: article.published ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)', color: article.published ? '#16a34a' : '#ca8a04', fontWeight: 700 }}>
                  {article.published ? 'Published' : 'Draft'}
                </span>
              </div>
              <div style={{ color: 'var(--text)' }}>{article.viewCount || 0}</div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button onClick={() => openEdit(article)} style={{ border: '1px solid var(--border)', background: 'var(--surface-light)', color: 'var(--text)', borderRadius: '7px', padding: '0.45rem', cursor: 'pointer' }} title="Edit"><Edit3 size={14} /></button>
                <button onClick={() => togglePublished(article)} style={{ border: '1px solid var(--border)', background: 'var(--surface-light)', color: article.published ? '#ca8a04' : '#16a34a', borderRadius: '7px', padding: '0.45rem', cursor: 'pointer' }} title={article.published ? 'Unpublish' : 'Publish'}>
                  {article.published ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => deleteArticle(article)} style={{ border: '1px solid rgba(239,68,68,0.45)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '7px', padding: '0.45rem', cursor: 'pointer' }} title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))
        )}
        </div>
       </div>
      </div>
    </div>
  );
};

export default AdminArticles;
