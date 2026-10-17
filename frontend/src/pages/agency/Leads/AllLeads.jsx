import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Search, Mail, Phone, MessageSquare, ChevronRight, ChevronDown, Filter, Plus, X, Building2, TrendingUp, Edit2, Trash2, Save } from 'lucide-react';
import API_BASE_URL from '../../../apiConfig';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AllLeads = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewLead, setViewLead] = useState(null);
    const [editLead, setEditLead] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [noteContent, setNoteContent] = useState('');
    const [notification, setNotification] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const stages = ['New Lead', 'Contacted', 'Site Visit', 'Negotiation', 'Booked', 'Sold', 'Lost'];

    useEffect(() => {
        if (user) {
            fetchLeads();
            fetchProperties();
        }
    }, [user]);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${API_BASE_URL}/leads`);
            const leadsList = Array.isArray(data) ? data : (data?.data || data?.leads || []);
            setLeads(leadsList);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching leads:', error);
            setLeads([]);
            setLoading(false);
        }
    };

    const fetchProperties = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/properties/agency/${user._id}`);
            setProperties(data);
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const updateLeadStatus = async (leadId, newStatus) => {
        try {
            await axios.patch(`${API_BASE_URL}/leads/${leadId}/status`, { status: newStatus });
            setLeads(leads.map(l => l._id === leadId ? { ...l, status: newStatus } : l));
            if (viewLead?._id === leadId) setViewLead(prev => ({ ...prev, status: newStatus }));
            
            setNotification({ message: `Status updated to ${newStatus}`, type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error(error);
            setNotification({ message: 'Failed to update status', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleAddNote = async (id) => {
        if (!noteContent.trim()) return;
        try {
            const { data } = await axios.post(`${API_BASE_URL}/leads/${id}/notes`, { content: noteContent });
            setLeads(leads.map(l => l._id === id ? data : l));
            if (viewLead?._id === id) setViewLead(data);
            setNoteContent('');
            setViewLead(null); 
            
            setNotification({ message: 'Note added & Timeline updated', type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error(error);
            setNotification({ message: 'Failed to add note', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_BASE_URL}/leads/${id}`);
            setLeads(leads.filter(l => l._id !== id));
            setDeleteConfirm(null);
            setNotification({ message: 'Lead deleted successfully', type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error(error);
            setNotification({ message: 'Failed to delete lead', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleUpdateLead = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data } = await axios.patch(`${API_BASE_URL}/leads/${editLead._id}`, editLead);
            setLeads(leads.map(l => l._id === editLead._id ? data : l));
            setEditLead(null);
            setNotification({ message: 'Lead updated successfully', type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update lead');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredLeads = leads.filter(l => {
        const matchesSearch = 
            l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.property?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = !statusFilter || l.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div>Loading leads...</div>;

    return (
        <div className="animate-fade">
             {/* Notification Toast */}
             {notification && (
                <div style={{ 
                    position: 'fixed', 
                    top: '20px', 
                    right: '20px', 
                    background: notification.type === 'success' ? '#10b981' : '#ef4444', 
                    color: 'white', 
                    padding: '1rem 2rem', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
                    zIndex: 2000, 
                    fontWeight: '700',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {notification.type === 'success' ? <Plus size={18} /> : <X size={18} />}
                        {notification.message}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>All Leads</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Search leads..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', width: '300px', color: 'var(--text)' }} 
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: '0.6rem 2.5rem 0.6rem 2.5rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', appearance: 'none', cursor: 'pointer' }}
                        >
                            <option value="">All Statuses</option>
                            {stages.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard/agency/leads/add')}>
                        <Plus size={18} /> Create Lead
                    </button>
                </div>
            </div>

            <div className="glass-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--surface-light)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800' }}>
                            <tr>
                                <th style={{ padding: '1rem 1.5rem' }}>NAME</th>
                                <th style={{ padding: '1rem 1.5rem' }}>PROPERTY</th>
                                <th style={{ padding: '1rem 1.5rem' }}>CONTACT</th>
                                <th style={{ padding: '1rem 1.5rem' }}>STATUS</th>
                                <th style={{ padding: '1rem 1.5rem' }}>DATE</th>
                                <th style={{ padding: '1rem 1.5rem' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map(l => (
                                <tr key={l._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{l.name}</div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ fontSize: '0.85rem' }}>{l.property?.title || 'General Enquiry'}</div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <a href={`mailto:${l.email}`} style={{ color: 'var(--text-muted)' }}><Mail size={16} /></a>
                                            {l.phone && <a href={`tel:${l.phone}`} style={{ color: 'var(--text-muted)' }}><Phone size={16} /></a>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{ 
                                            fontSize: '0.75rem', 
                                            fontWeight: '700', 
                                            padding: '4px 10px', 
                                            borderRadius: '20px',
                                            background: 'var(--surface-light)',
                                            color: 'var(--text-muted)'
                                        }}>{l.status || 'New Lead'}</span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {new Date(l.createdAt || Date.now()).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => setEditLead({ ...l, propertyId: l.property?._id || '' })}
                                                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                                title="Edit Client"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => setDeleteConfirm(l._id)}
                                                style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                title="Delete Lead"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => setViewLead(l)}
                                                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                                title="View History"
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredLeads.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No leads found.</p>}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                    <div className="glass-card animate-scale" style={{ width: '400px', padding: '2rem', background: 'var(--surface)', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Trash2 size={30} />
                        </div>
                        <h3 style={{ marginBottom: '1rem', fontWeight: '800' }}>Delete Lead?</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>This action cannot be undone. All history and notes will be permanently removed.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1, background: '#ef4444', border: 'none' }} onClick={() => handleDelete(deleteConfirm)}>Delete Now</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lead Details Modal */}
            {viewLead && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <div className="glass-card animate-fade" style={{ width: '100%', maxWidth: '800px', padding: '0', background: 'var(--surface)', borderRadius: '16px', overflow: 'hidden', display: 'flex', height: '80vh' }}>
                        {/* Side Info */}
                        <div style={{ width: '280px', background: 'var(--surface-light)', borderRight: '1px solid var(--border)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '800', margin: '0 auto 1rem' }}>
                                    {viewLead.name.charAt(0)}
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.2rem' }}>{viewLead.name}</h3>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{viewLead.status || 'New Lead'}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Mail size={16} color="var(--text-muted)" />
                                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{viewLead.email}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Phone size={16} color="var(--text-muted)" />
                                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{viewLead.phone || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Building2 size={16} color="var(--text-muted)" />
                                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{viewLead.property?.title || 'General Property Enquiry'}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>UPDATE STATUS</label>
                                <select 
                                    value={viewLead.status || 'New Lead'} 
                                    onChange={(e) => updateLeadStatus(viewLead._id, e.target.value)}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--surface)', color: 'var(--text)', fontWeight: '600' }}
                                >
                                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Lead Profile & History</h4>
                                <button className="btn btn-outline" onClick={() => setViewLead(null)} style={{ padding: '0.4rem', border: 'none' }}><X size={20} /></button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
                                <div style={{ padding: '1rem', background: 'rgba(249, 115, 22, 0.05)', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '0.5rem' }}>ORIGINAL ENQUIRY / REQUIREMENT</div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: '1.5' }}>{viewLead.message || 'No initial message provided'}</p>
                                </div>

                                {viewLead.notes?.map((n, i) => (
                                    <div key={i} style={{ padding: '1rem', fontSize: '0.85rem', background: 'var(--surface-light)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '700' }}>{new Date(n.date).toLocaleString()}</span>
                                            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--primary)' }}>INTERNAL NOTE</span>
                                        </div>
                                        <div>{n.content}</div>
                                    </div>
                                ))}
                                {(!viewLead.notes?.length) && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0' }}>No history recorded yet.</p>}
                            </div>

                            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <textarea 
                                    className="input-control" 
                                    placeholder="Type a new update note..." 
                                    value={noteContent} 
                                    onChange={e => setNoteContent(e.target.value)}
                                    style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--text)', marginBottom: '0.8rem', minHeight: '80px' }}
                                ></textarea>
                                <button className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} onClick={() => handleAddNote(viewLead._id)}>
                                    Add Note & Update History
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Lead Modal */}
            {editLead && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.1)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <div className="glass-card animate-fade" style={{ width: '100%', maxWidth: '600px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.5rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.3rem' }}>Edit Client Profile</h3>
                            <button className="btn btn-outline" onClick={() => setEditLead(null)} style={{ padding: '0.4rem', border: 'none' }}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '2rem 2.5rem', overflowY: 'auto' }}>
                            <form onSubmit={handleUpdateLead} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                                    <div className="input-group">
                                        <label style={{ fontWeight: '700', marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>Full Name</label>
                                        <input type="text" className="input-control" required value={editLead.name} onChange={e => setEditLead({...editLead, name: e.target.value})} style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontWeight: '700', marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>Phone</label>
                                        <input type="text" className="input-control" value={editLead.phone} onChange={e => setEditLead({...editLead, phone: e.target.value})} style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label style={{ fontWeight: '700', marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>Email Address</label>
                                    <input type="email" className="input-control" required value={editLead.email} onChange={e => setEditLead({...editLead, email: e.target.value})} style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.2rem' }}>
                                    <div className="input-group">
                                        <label style={{ fontWeight: '700', marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>Property</label>
                                        <select className="input-control" value={editLead.propertyId} onChange={e => setEditLead({...editLead, propertyId: e.target.value})} style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                                            <option value="">General Enquiry</option>
                                            {properties.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontWeight: '700', marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>Status</label>
                                        <select className="input-control" value={editLead.status} onChange={e => setEditLead({...editLead, status: e.target.value})} style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                                            {stages.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label style={{ fontWeight: '700', marginBottom: '0.4rem', display: 'block', fontSize: '0.85rem' }}>Message / Notes</label>
                                    <textarea className="input-control" rows="3" value={editLead.message} onChange={e => setEditLead({...editLead, message: e.target.value})} style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--text)' }}></textarea>
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', fontWeight: '800' }}>
                                    <Save size={18} /> {submitting ? 'Updating...' : 'Save Profile Changes'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllLeads;
