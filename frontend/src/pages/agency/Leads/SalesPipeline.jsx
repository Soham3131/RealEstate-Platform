import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Users, Mail, Phone, MessageSquare, X, 
    Plus, TrendingUp, Search, Filter, RefreshCw,
    Building2, Calendar, CheckCircle2, AlertCircle,
    ArrowRight, ExternalLink, IndianRupee, Activity,
    SlidersHorizontal, Eye, MessageCircle, Clock, Sparkles
} from 'lucide-react';
import API_BASE_URL from '../../../apiConfig';
import { useAuth } from '../../../context/AuthContext';
import { formatINR } from '../../../utils/format';

const STAGES = [
    { id: 'New Lead', label: 'New Lead', color: '#3B82F6', lightBg: 'rgba(59, 130, 246, 0.08)', desc: 'Fresh inquiries' },
    { id: 'Contacted', label: 'Contacted', color: '#0EA5E9', lightBg: 'rgba(14, 165, 233, 0.08)', desc: 'Initial contact made' },
    { id: 'Site Visit', label: 'Site Visit', color: '#8B5CF6', lightBg: 'rgba(139, 92, 246, 0.08)', desc: 'Tour scheduled/done' },
    { id: 'Negotiation', label: 'Negotiation', color: '#F59E0B', lightBg: 'rgba(245, 158, 11, 0.08)', desc: 'Offers & discussions' },
    { id: 'Booked', label: 'Booked', color: '#14B8A6', lightBg: 'rgba(20, 184, 166, 0.08)', desc: 'Token/deposit paid' },
    { id: 'Sold', label: 'Sold', color: '#10B981', lightBg: 'rgba(16, 185, 129, 0.08)', desc: 'Closed & registered' },
    { id: 'Lost', label: 'Lost', color: '#64748B', lightBg: 'rgba(100, 116, 139, 0.08)', desc: 'Archived / dropped' },
];

const QUICK_NOTE_PRESETS = [
    '📞 Spoke with client — interested in 3BHK layout.',
    '🏡 Scheduled physical site visit for upcoming weekend.',
    '💰 Price negotiation initiated; client offered counter-proposal.',
    '📄 Waiting on bank pre-approval and KYC documents.',
    '⏳ Follow-up scheduled for next Tuesday.'
];

const SalesPipeline = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data States
    const [leads, setLeads] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filter & Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('newest');

    // Drag and Drop States
    const [draggingLeadId, setDraggingLeadId] = useState(null);
    const [dragOverStage, setDragOverStage] = useState(null);

    // Modal States
    const [viewLead, setViewLead] = useState(null);
    const [showQuickNoteLead, setShowQuickNoteLead] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createStageDefault, setCreateStageDefault] = useState('New Lead');
    const [noteContent, setNoteContent] = useState('');
    const [submittingNote, setSubmittingNote] = useState(false);
    const [notification, setNotification] = useState(null);

    // New Lead Form State
    const [newLeadForm, setNewLeadForm] = useState({
        name: '',
        email: '',
        phone: '',
        propertyId: '',
        status: 'New Lead',
        message: 'Direct enquiry added from CRM Pipeline',
        source: 'Direct'
    });
    const [creatingLead, setCreatingLead] = useState(false);

    useEffect(() => {
        if (user) {
            fetchInitialData();
        } else {
            setLoading(false);
        }
    }, [user]);

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3500);
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchLeads(), fetchProperties()]);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeads = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/leads`);
            const leadsList = Array.isArray(data) ? data : (data?.data || data?.leads || []);
            setLeads(leadsList);
        } catch (error) {
            console.error('Error fetching leads:', error);
            setLeads([]);
            showToast('Unable to load leads from backend', 'error');
        }
    };

    const fetchProperties = async () => {
        if (!user?._id) return;
        try {
            const { data } = await axios.get(`${API_BASE_URL}/properties/agency/${user._id}`);
            const propList = Array.isArray(data) ? data : (data?.data || data?.properties || []);
            setProperties(propList);
        } catch (error) {
            console.warn('Error fetching agency properties:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchLeads(), fetchProperties()]);
        setRefreshing(false);
        showToast('Pipeline refreshed with latest updates', 'success');
    };

    // Status Updates
    const updateLeadStatus = async (leadId, newStatus) => {
        // Optimistic UI Update
        const previousLeads = [...leads];
        setLeads(prev => prev.map(l => l._id === leadId ? { ...l, status: newStatus } : l));
        if (viewLead?._id === leadId) {
            setViewLead(prev => ({ ...prev, status: newStatus }));
        }

        try {
            const { data } = await axios.patch(`${API_BASE_URL}/leads/${leadId}/status`, { status: newStatus });
            // Sync with backend populated response if provided
            if (data && data._id) {
                setLeads(prev => prev.map(l => l._id === leadId ? { ...l, ...data, property: data.property || l.property } : l));
            }
            showToast(`Lead moved to "${newStatus}"`, 'success');
        } catch (error) {
            console.error('Failed to update lead status:', error);
            setLeads(previousLeads);
            showToast(error.response?.data?.message || 'Failed to update status', 'error');
        }
    };

    // Notes Management
    const handleAddNote = async (id) => {
        if (!noteContent.trim()) return;
        setSubmittingNote(true);
        try {
            const { data } = await axios.post(`${API_BASE_URL}/leads/${id}/notes`, { content: noteContent });
            
            const updatedLead = leads.find(l => l._id === id);
            const newNote = { content: noteContent, date: new Date().toISOString() };
            const updatedNotes = data?.notes || [...(updatedLead?.notes || []), newNote];

            setLeads(prev => prev.map(l => l._id === id ? { ...l, notes: updatedNotes } : l));
            if (viewLead?._id === id) {
                setViewLead(prev => ({ ...prev, notes: updatedNotes }));
            }

            setNoteContent('');
            setShowQuickNoteLead(null);
            showToast('Note added & activity timeline updated', 'success');
        } catch (error) {
            console.error('Error adding note:', error);
            showToast(error.response?.data?.message || 'Failed to add note', 'error');
        } finally {
            setSubmittingNote(false);
        }
    };

    // Create New Lead
    const handleCreateLead = async (e) => {
        e.preventDefault();
        if (!newLeadForm.name || !newLeadForm.email) {
            showToast('Name and email are required', 'error');
            return;
        }

        setCreatingLead(true);
        try {
            const payload = {
                ...newLeadForm,
                propertyId: newLeadForm.propertyId || undefined,
                agencyId: user?._id
            };
            const { data } = await axios.post(`${API_BASE_URL}/leads`, payload);
            
            // Re-fetch to ensure relations are populated
            await fetchLeads();
            setShowCreateModal(false);
            setNewLeadForm({
                name: '',
                email: '',
                phone: '',
                propertyId: '',
                status: 'New Lead',
                message: 'Direct enquiry added from CRM Pipeline',
                source: 'Direct'
            });
            showToast('New prospect successfully added to pipeline', 'success');
        } catch (error) {
            console.error('Failed to create lead:', error);
            showToast(error.response?.data?.message || 'Failed to create lead', 'error');
        } finally {
            setCreatingLead(false);
        }
    };

    // Drag and Drop handlers
    const handleDragStart = (e, lead) => {
        setDraggingLeadId(lead._id);
        e.dataTransfer.setData('text/plain', lead._id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggingLeadId(null);
        setDragOverStage(null);
    };

    const handleDragOver = (e, stageId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverStage !== stageId) {
            setDragOverStage(stageId);
        }
    };

    const handleDragLeave = (e, stageId) => {
        if (dragOverStage === stageId) {
            setDragOverStage(null);
        }
    };

    const handleDrop = async (e, stageId) => {
        e.preventDefault();
        setDragOverStage(null);
        const leadId = e.dataTransfer.getData('text/plain') || draggingLeadId;
        if (!leadId) return;

        const currentLead = leads.find(l => l._id === leadId);
        if (currentLead && (currentLead.status || 'New Lead') !== stageId) {
            await updateLeadStatus(leadId, stageId);
        }
        setDraggingLeadId(null);
    };

    // Filter & Sort leads
    const safeLeads = useMemo(() => Array.isArray(leads) ? leads : [], [leads]);

    const filteredLeads = useMemo(() => {
        return safeLeads.filter(lead => {
            const q = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || (
                (lead.name || '').toLowerCase().includes(q) ||
                (lead.email || '').toLowerCase().includes(q) ||
                (lead.phone || '').toLowerCase().includes(q) ||
                (lead.property?.title || '').toLowerCase().includes(q) ||
                (lead.property?.location?.city || '').toLowerCase().includes(q)
            );

            const matchesSource = sourceFilter === 'ALL' || (lead.source || 'Direct') === sourceFilter;
            return matchesSearch && matchesSource;
        }).sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            if (sortBy === 'price-high') return (b.property?.price || 0) - (a.property?.price || 0);
            if (sortBy === 'notes') return (b.notes?.length || 0) - (a.notes?.length || 0);
            return 0;
        });
    }, [safeLeads, searchTerm, sourceFilter, sortBy]);

    // Metrics calculations
    const stats = useMemo(() => {
        const total = safeLeads.length;
        const activeStages = ['New Lead', 'Contacted', 'Site Visit', 'Negotiation'];
        const active = safeLeads.filter(l => activeStages.includes(l.status || 'New Lead')).length;
        const sold = safeLeads.filter(l => l.status === 'Sold').length;
        const pipelineValue = safeLeads
            .filter(l => l.status !== 'Lost')
            .reduce((sum, l) => sum + (l.property?.price || 0), 0);
        const conversionRate = total > 0 ? Math.round((sold / total) * 100) : 0;

        return { total, active, sold, pipelineValue, conversionRate };
    }, [safeLeads]);

    const getWhatsAppUrl = (phone, name, propertyTitle) => {
        if (!phone) return '#';
        const cleanNumber = phone.replace(/[^0-9]/g, '');
        const msg = encodeURIComponent(`Hello ${name || 'Client'}, this is regarding your property enquiry for "${propertyTitle || 'the property'}" on Millionaire Real Estate platform.`);
        return `https://wa.me/${cleanNumber}?text=${msg}`;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '65vh', gap: '1rem' }}>
                <TrendingUp className="animate-pulse" size={44} color="var(--primary)" />
                <p style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.95rem' }}>Loading CRM Sales Pipeline...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="glass-card" style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
                <Users size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.8rem' }}>Agency Login Required</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    You must be logged in as an Agency or Admin to view and manage your CRM Sales Pipeline.
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/login')}>
                    Sign In to Continue
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade" style={{ paddingBottom: '3rem' }}>
            {/* Notification Toast */}
            {notification && (
                <div style={{ 
                    position: 'fixed', 
                    top: '24px', 
                    right: '24px', 
                    background: notification.type === 'success' ? '#10b981' : '#ef4444', 
                    color: '#ffffff', 
                    padding: '0.9rem 1.6rem', 
                    borderRadius: '12px', 
                    boxShadow: '0 12px 28px -6px rgba(0,0,0,0.3)', 
                    zIndex: 9999, 
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {notification.message}
                </div>
            )}

            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.2rem', marginBottom: '1.8rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.3rem' }}>
                        <h2 style={{ fontSize: '1.9rem', fontWeight: '800', letterSpacing: '-0.02em' }}>CRM Sales Pipeline</h2>
                        <span style={{ 
                            background: 'rgba(198, 161, 91, 0.15)', 
                            color: 'var(--primary)', 
                            border: '1px solid rgba(198, 161, 91, 0.3)', 
                            padding: '3px 10px', 
                            borderRadius: '20px', 
                            fontSize: '0.72rem', 
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Kanban Board
                        </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Drag & drop leads across stages to track customer journeys from discovery to closing.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button 
                        className="btn btn-outline" 
                        onClick={handleRefresh}
                        disabled={refreshing}
                        style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        title="Refresh Pipeline"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                    <button 
                        className="btn btn-outline" 
                        onClick={() => navigate('/dashboard/agency/leads')}
                        style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Users size={16} />
                        <span>List View</span>
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => {
                            setCreateStageDefault('New Lead');
                            setShowCreateModal(true);
                        }}
                        style={{ padding: '0.65rem 1.3rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                    >
                        <Plus size={18} />
                        <span>New Lead</span>
                    </button>
                </div>
            </div>

            {/* KPI Performance Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '1.8rem'
            }}>
                <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Prospects</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.total}</div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active In Pipeline</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats.active}</div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(198, 161, 91, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IndianRupee size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pipeline Volume</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: '800' }}>{formatINR(stats.pipelineValue)}</div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deals Won / Ratio</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                            {stats.sold} <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: '700' }}>({stats.conversionRate}%)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search Control Bar */}
            <div className="glass-card" style={{ padding: '1rem 1.2rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: '1 1 320px' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="text"
                            className="input-control"
                            placeholder="Search client name, phone, email, or property title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.4rem', height: '40px', fontSize: '0.88rem' }}
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')} 
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                    {/* Source Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>SOURCE:</span>
                        <select 
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                            style={{ 
                                padding: '0.45rem 0.8rem', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border)', 
                                background: 'var(--surface-light)', 
                                color: 'var(--text)',
                                fontSize: '0.82rem',
                                fontWeight: '600'
                            }}
                        >
                            <option value="ALL">All Sources</option>
                            <option value="Direct">Direct</option>
                            <option value="Facebook Ads">Facebook Ads</option>
                            <option value="Organic Search">Organic Search</option>
                            <option value="Realtor.com">Realtor.com</option>
                            <option value="Zillow Premium">Zillow Premium</option>
                        </select>
                    </div>

                    {/* Sort Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>SORT:</span>
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{ 
                                padding: '0.45rem 0.8rem', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border)', 
                                background: 'var(--surface-light)', 
                                color: 'var(--text)',
                                fontSize: '0.82rem',
                                fontWeight: '600'
                            }}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="price-high">Highest Deal Value</option>
                            <option value="notes">Most Activity Notes</option>
                        </select>
                    </div>

                    {(searchTerm || sourceFilter !== 'ALL') && (
                        <button 
                            onClick={() => { setSearchTerm(''); setSourceFilter('ALL'); }}
                            style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', padding: '0.4rem' }}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Kanban Columns Horizontal Track */}
            <div style={{
                display: 'grid',
                gridAutoFlow: 'column',
                gridAutoColumns: 'minmax(310px, 1fr)',
                gap: '1.1rem',
                overflowX: 'auto',
                paddingBottom: '1.5rem',
                alignItems: 'start'
            }}>
                {STAGES.map(stage => {
                    const stageLeads = filteredLeads.filter(l => (l.status || 'New Lead') === stage.id);
                    const stageValue = stageLeads.reduce((acc, l) => acc + (l.property?.price || 0), 0);
                    const isDragOver = dragOverStage === stage.id;

                    return (
                        <div 
                            key={stage.id} 
                            onDragOver={(e) => handleDragOver(e, stage.id)}
                            onDragLeave={(e) => handleDragLeave(e, stage.id)}
                            onDrop={(e) => handleDrop(e, stage.id)}
                            style={{ 
                                minWidth: '310px',
                                background: 'var(--surface)',
                                borderRadius: '14px',
                                border: isDragOver ? `2px dashed ${stage.color}` : '1px solid var(--border)',
                                boxShadow: isDragOver ? `0 0 16px ${stage.color}33` : 'none',
                                transition: 'border 0.2s ease, box-shadow 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                maxHeight: 'calc(100vh - 280px)',
                                minHeight: '480px'
                            }}
                        >
                            {/* Column Header */}
                            <div style={{ 
                                padding: '0.9rem 1.1rem', 
                                borderBottom: '1px solid var(--border)',
                                background: stage.lightBg,
                                borderRadius: '13px 13px 0 0',
                                borderTop: `3px solid ${stage.color}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: stage.color }}></div>
                                        <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            {stage.label}
                                        </h3>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ 
                                            background: 'var(--surface)', 
                                            color: stage.color, 
                                            padding: '2px 8px', 
                                            borderRadius: '12px', 
                                            fontSize: '0.74rem', 
                                            fontWeight: '800',
                                            border: `1px solid ${stage.color}33`
                                        }}>
                                            {stageLeads.length}
                                        </span>
                                        <button 
                                            onClick={() => {
                                                setCreateStageDefault(stage.id);
                                                setNewLeadForm(prev => ({ ...prev, status: stage.id }));
                                                setShowCreateModal(true);
                                            }}
                                            style={{ 
                                                background: 'var(--surface)', 
                                                border: '1px solid var(--border)', 
                                                color: 'var(--text-muted)', 
                                                borderRadius: '6px', 
                                                width: '24px', 
                                                height: '24px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                cursor: 'pointer' 
                                            }}
                                            title={`Add prospect to ${stage.label}`}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                    <span>{stage.desc}</span>
                                    {stageValue > 0 && (
                                        <span style={{ color: 'var(--text)', fontWeight: '700' }}>
                                            {formatINR(stageValue)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Cards Scrollable List */}
                            <div style={{ 
                                padding: '0.9rem', 
                                flex: 1, 
                                overflowY: 'auto', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '0.85rem' 
                            }}>
                                {stageLeads.map(lead => {
                                    const isBeingDragged = draggingLeadId === lead._id;
                                    const leadNotesCount = lead.notes?.length || 0;
                                    const propertyTitle = lead.property?.title || 'General Enquiry';
                                    const propertyPrice = lead.property?.price;

                                    return (
                                        <div 
                                            key={lead._id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, lead)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => setViewLead(lead)}
                                            style={{ 
                                                background: 'var(--surface-light)', 
                                                border: '1px solid var(--border)', 
                                                borderRadius: '11px',
                                                padding: '1rem',
                                                cursor: 'grab',
                                                opacity: isBeingDragged ? 0.4 : 1,
                                                transform: isBeingDragged ? 'scale(0.97)' : 'none',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-3px)';
                                                e.currentTarget.style.boxShadow = '0 8px 18px rgba(0,0,0,0.08)';
                                                e.currentTarget.style.borderColor = stage.color;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
                                                e.currentTarget.style.borderColor = 'var(--border)';
                                            }}
                                        >
                                            {/* Prospect Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ 
                                                        width: '32px', 
                                                        height: '32px', 
                                                        borderRadius: '50%', 
                                                        background: `linear-gradient(135deg, ${stage.color}, var(--primary))`, 
                                                        color: '#ffffff', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        fontSize: '0.85rem', 
                                                        fontWeight: '800' 
                                                    }}>
                                                        {(lead.name || 'C').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text)' }}>
                                                            {lead.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <span style={{ 
                                                    fontSize: '0.65rem', 
                                                    padding: '2px 7px', 
                                                    borderRadius: '6px', 
                                                    fontWeight: '700',
                                                    background: 'var(--surface)',
                                                    color: 'var(--text-muted)',
                                                    border: '1px solid var(--border)'
                                                }}>
                                                    {lead.source || 'Direct'}
                                                </span>
                                            </div>

                                            {/* Property Section */}
                                            <div style={{ 
                                                background: 'var(--surface)', 
                                                padding: '0.65rem 0.8rem', 
                                                borderRadius: '8px', 
                                                border: '1px solid var(--border)',
                                                marginBottom: '0.8rem' 
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: '700', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                                                    <Building2 size={14} />
                                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                                                        {propertyTitle}
                                                    </span>
                                                </div>
                                                {propertyPrice ? (
                                                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text)' }}>
                                                        {formatINR(propertyPrice)}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Price on Request</div>
                                                )}
                                            </div>

                                            {/* Communication & Quick Action Row */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.8rem' }}>
                                                {lead.phone && (
                                                    <a 
                                                        href={`tel:${lead.phone}`} 
                                                        onClick={e => e.stopPropagation()} 
                                                        style={{ 
                                                            flex: 1, 
                                                            padding: '0.4rem', 
                                                            borderRadius: '6px', 
                                                            background: 'var(--surface)', 
                                                            border: '1px solid var(--border)', 
                                                            color: 'var(--text)', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                            textDecoration: 'none'
                                                        }}
                                                        title={`Call ${lead.phone}`}
                                                    >
                                                        <Phone size={13} />
                                                    </a>
                                                )}

                                                {lead.phone && (
                                                    <a 
                                                        href={getWhatsAppUrl(lead.phone, lead.name, propertyTitle)}
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        onClick={e => e.stopPropagation()} 
                                                        style={{ 
                                                            flex: 1, 
                                                            padding: '0.4rem', 
                                                            borderRadius: '6px', 
                                                            background: 'rgba(37, 211, 102, 0.1)', 
                                                            border: '1px solid rgba(37, 211, 102, 0.3)', 
                                                            color: '#25D366', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                            textDecoration: 'none'
                                                        }}
                                                        title="Chat on WhatsApp"
                                                    >
                                                        <MessageCircle size={13} />
                                                    </a>
                                                )}

                                                <a 
                                                    href={`mailto:${lead.email}`} 
                                                    onClick={e => e.stopPropagation()} 
                                                    style={{ 
                                                        flex: 1, 
                                                        padding: '0.4rem', 
                                                        borderRadius: '6px', 
                                                        background: 'var(--surface)', 
                                                        border: '1px solid var(--border)', 
                                                        color: 'var(--text)', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        textDecoration: 'none'
                                                    }}
                                                    title={`Email ${lead.email}`}
                                                >
                                                    <Mail size={13} />
                                                </a>

                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        setShowQuickNoteLead(lead); 
                                                    }}
                                                    style={{ 
                                                        flex: 1, 
                                                        padding: '0.4rem', 
                                                        borderRadius: '6px', 
                                                        background: 'var(--surface)', 
                                                        border: '1px solid var(--border)', 
                                                        color: 'var(--text)', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Add Quick Note"
                                                >
                                                    <MessageSquare size={13} />
                                                </button>
                                            </div>

                                            {/* Card Footer: Quick Stage Switcher & Notes Count */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.6rem', borderTop: '1px solid var(--border)' }}>
                                                <select 
                                                    value={lead.status || 'New Lead'} 
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={(e) => updateLeadStatus(lead._id, e.target.value)}
                                                    style={{ 
                                                        background: 'var(--surface)', 
                                                        color: stage.color, 
                                                        border: `1px solid ${stage.color}44`, 
                                                        borderRadius: '6px', 
                                                        fontSize: '0.72rem', 
                                                        fontWeight: '800', 
                                                        padding: '2px 6px',
                                                        cursor: 'pointer' 
                                                    }}
                                                >
                                                    {STAGES.map(s => (
                                                        <option key={s.id} value={s.id}>{s.label}</option>
                                                    ))}
                                                </select>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                    <Clock size={11} />
                                                    <span>{leadNotesCount} {leadNotesCount === 1 ? 'note' : 'notes'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {stageLeads.length === 0 && (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '3rem 1rem', 
                                        color: 'var(--text-muted)', 
                                        fontSize: '0.8rem', 
                                        border: '1px dashed var(--border)', 
                                        borderRadius: '10px',
                                        background: 'rgba(0,0,0,0.02)'
                                    }}>
                                        <p style={{ margin: 0, fontWeight: '600' }}>No prospects in {stage.label}</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.72rem', opacity: 0.8 }}>Drag a lead card here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Comprehensive Lead Detail Modal */}
            {viewLead && (
                <div style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    background: 'rgba(0,0,0,0.65)', 
                    zIndex: 2000, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backdropFilter: 'blur(8px)',
                    padding: '1.5rem'
                }}>
                    <div className="glass-card animate-fade" style={{ 
                        width: '100%', 
                        maxWidth: '900px', 
                        padding: 0, 
                        background: 'var(--surface)', 
                        borderRadius: '18px', 
                        overflow: 'hidden', 
                        display: 'flex', 
                        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                        maxHeight: '85vh',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                        border: '1px solid var(--border)'
                    }}>
                        {/* Side Profile Info */}
                        <div style={{ 
                            width: window.innerWidth < 768 ? '100%' : '320px', 
                            background: 'var(--surface-light)', 
                            borderRight: '1px solid var(--border)', 
                            padding: '1.8rem', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '1.4rem' 
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ 
                                    width: '72px', 
                                    height: '72px', 
                                    borderRadius: '50%', 
                                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                                    color: '#ffffff', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontSize: '1.8rem', 
                                    fontWeight: '800', 
                                    margin: '0 auto 0.8rem',
                                    boxShadow: '0 8px 20px rgba(198, 161, 91, 0.3)'
                                }}>
                                    {(viewLead.name || 'C').charAt(0).toUpperCase()}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.2rem' }}>{viewLead.name}</h3>
                                <span style={{ 
                                    display: 'inline-block',
                                    background: 'var(--surface)', 
                                    color: 'var(--primary)', 
                                    border: '1px solid var(--primary)', 
                                    padding: '2px 10px', 
                                    borderRadius: '12px', 
                                    fontSize: '0.72rem', 
                                    fontWeight: '800' 
                                }}>
                                    {viewLead.status || 'New Lead'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Mail size={16} color="var(--primary)" />
                                    <a href={`mailto:${viewLead.email}`} style={{ fontSize: '0.85rem', color: 'var(--text)', textDecoration: 'none' }}>
                                        {viewLead.email}
                                    </a>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Phone size={16} color="var(--primary)" />
                                    <span style={{ fontSize: '0.85rem' }}>{viewLead.phone || 'No phone provided'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Calendar size={16} color="var(--primary)" />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {viewLead.createdAt ? new Date(viewLead.createdAt).toLocaleString('en-IN') : 'Recently added'}
                                    </span>
                                </div>
                            </div>

                            {/* Property Details Snapshot */}
                            <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                                    Interested Listing
                                </div>
                                <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text)', marginBottom: '0.3rem' }}>
                                    {viewLead.property?.title || 'General Property Enquiry'}
                                </div>
                                {viewLead.property?.price && (
                                    <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--primary)' }}>
                                        {formatINR(viewLead.property.price)}
                                    </div>
                                )}
                            </div>

                            {/* Direct Communication Actions */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {viewLead.phone && (
                                    <a 
                                        href={getWhatsAppUrl(viewLead.phone, viewLead.name, viewLead.property?.title)}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn btn-outline" 
                                        style={{ flex: 1, padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', color: '#25D366', borderColor: '#25D366' }}
                                    >
                                        <MessageCircle size={15} /> WhatsApp
                                    </a>
                                )}
                                {viewLead.phone && (
                                    <a 
                                        href={`tel:${viewLead.phone}`} 
                                        className="btn btn-outline" 
                                        style={{ flex: 1, padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}
                                    >
                                        <Phone size={15} /> Call
                                    </a>
                                )}
                            </div>

                            {/* Pipeline Status Mover */}
                            <div style={{ marginTop: 'auto' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                                    Update Stage
                                </label>
                                <select 
                                    value={viewLead.status || 'New Lead'} 
                                    onChange={(e) => updateLeadStatus(viewLead._id, e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.65rem', 
                                        borderRadius: '8px', 
                                        border: '1px solid var(--border)', 
                                        fontSize: '0.85rem', 
                                        fontWeight: '700',
                                        background: 'var(--surface)',
                                        color: 'var(--text)'
                                    }}
                                >
                                    {STAGES.map(s => (
                                        <option key={s.id} value={s.id}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Main Body: Enquiry Message & Notes Timeline */}
                        <div style={{ flex: 1, padding: '1.8rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Activity & Communications</h4>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Lead ID: {viewLead._id}</span>
                                </div>
                                <button 
                                    onClick={() => setViewLead(null)} 
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Original Message */}
                                <div style={{ 
                                    padding: '1rem 1.2rem', 
                                    background: 'rgba(198, 161, 91, 0.06)', 
                                    border: '1px solid rgba(198, 161, 91, 0.25)', 
                                    borderRadius: '12px' 
                                }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Sparkles size={13} /> Original Enquiry Message
                                    </div>
                                    <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: '1.6', margin: 0 }}>
                                        "{viewLead.message || 'No enquiry message was provided.'}"
                                    </p>
                                </div>

                                {/* Quick Note Preset Buttons */}
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                        Quick Templates:
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {QUICK_NOTE_PRESETS.map((preset, idx) => (
                                            <button 
                                                key={idx}
                                                type="button"
                                                onClick={() => setNoteContent(preset)}
                                                style={{ 
                                                    background: 'var(--surface-light)', 
                                                    border: '1px solid var(--border)', 
                                                    borderRadius: '6px', 
                                                    padding: '3px 8px', 
                                                    fontSize: '0.74rem', 
                                                    color: 'var(--text)', 
                                                    cursor: 'pointer' 
                                                }}
                                            >
                                                {preset.slice(0, 32)}...
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Timeline of notes */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        Timeline History ({viewLead.notes?.length || 0})
                                    </div>

                                    {viewLead.notes && viewLead.notes.length > 0 ? (
                                        viewLead.notes.map((note, idx) => (
                                            <div 
                                                key={idx} 
                                                style={{ 
                                                    padding: '0.85rem 1rem', 
                                                    background: 'var(--surface-light)', 
                                                    borderRadius: '10px', 
                                                    border: '1px solid var(--border)' 
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary)' }}>CRM Interaction</span>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                        {note.date ? new Date(note.date).toLocaleString('en-IN') : 'Logged'}
                                                    </span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text)', lineHeight: '1.5' }}>
                                                    {note.content}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                            No activity notes added yet. Add one below to track negotiations.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Note Input Footer */}
                            <div style={{ paddingTop: '1.2rem', borderTop: '1px solid var(--border)', marginTop: '1rem' }}>
                                <textarea 
                                    className="input-control" 
                                    rows="3"
                                    placeholder="Type an activity note (e.g., spoke on call, client liked kitchen layout, loan approved)..."
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    style={{ width: '100%', marginBottom: '0.8rem', fontSize: '0.88rem' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                                    <button 
                                        className="btn btn-outline" 
                                        onClick={() => setNoteContent('')}
                                        disabled={!noteContent}
                                    >
                                        Clear
                                    </button>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => handleAddNote(viewLead._id)}
                                        disabled={submittingNote || !noteContent.trim()}
                                    >
                                        {submittingNote ? 'Saving...' : 'Add Note to Timeline'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Note Modal */}
            {showQuickNoteLead && (
                <div style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    background: 'rgba(0,0,0,0.6)', 
                    zIndex: 2100, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backdropFilter: 'blur(5px)',
                    padding: '1rem'
                }}>
                    <div className="glass-card animate-fade" style={{ width: '100%', maxWidth: '480px', padding: '1.8rem', background: 'var(--surface)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.2rem' }}>Quick Note</h3>
                                <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    For {showQuickNoteLead.name}
                                </p>
                            </div>
                            <button 
                                onClick={() => { setShowQuickNoteLead(null); setNoteContent(''); }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.8rem' }}>
                            {QUICK_NOTE_PRESETS.slice(0, 3).map((p, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setNoteContent(p)}
                                    style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', borderRadius: '6px', padding: '3px 7px', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--text)' }}
                                >
                                    {p.slice(0, 24)}...
                                </button>
                            ))}
                        </div>

                        <textarea 
                            className="input-control" 
                            rows="4"
                            placeholder="Add brief interaction notes..."
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            style={{ width: '100%', marginBottom: '1.2rem', fontSize: '0.88rem' }}
                        />

                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button 
                                className="btn btn-outline" 
                                style={{ flex: 1 }} 
                                onClick={() => { setShowQuickNoteLead(null); setNoteContent(''); }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                style={{ flex: 1 }} 
                                onClick={() => handleAddNote(showQuickNoteLead._id)}
                                disabled={submittingNote || !noteContent.trim()}
                            >
                                {submittingNote ? 'Saving...' : 'Save Note'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Create Lead Modal */}
            {showCreateModal && (
                <div style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    background: 'rgba(0,0,0,0.65)', 
                    zIndex: 2200, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backdropFilter: 'blur(6px)',
                    padding: '1rem'
                }}>
                    <div className="glass-card animate-fade" style={{ width: '100%', maxWidth: '540px', padding: '2rem', background: 'var(--surface)', borderRadius: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.3rem' }}>Create New Prospect</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    Record a prospective buyer directly into your pipeline.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>
                                    Full Name *
                                </label>
                                <input 
                                    type="text"
                                    required
                                    className="input-control"
                                    placeholder="e.g. Ramesh Sharma"
                                    value={newLeadForm.name}
                                    onChange={(e) => setNewLeadForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>
                                        Email Address *
                                    </label>
                                    <input 
                                        type="email"
                                        required
                                        className="input-control"
                                        placeholder="ramesh@example.com"
                                        value={newLeadForm.email}
                                        onChange={(e) => setNewLeadForm(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>
                                        Phone Number
                                    </label>
                                    <input 
                                        type="tel"
                                        className="input-control"
                                        placeholder="+91 98765 43210"
                                        value={newLeadForm.phone}
                                        onChange={(e) => setNewLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>
                                    Associated Listing (Optional)
                                </label>
                                <select 
                                    className="input-control"
                                    value={newLeadForm.propertyId}
                                    onChange={(e) => setNewLeadForm(prev => ({ ...prev, propertyId: e.target.value }))}
                                    style={{ background: 'var(--surface)', color: 'var(--text)' }}
                                >
                                    <option value="">General Inquiry (No specific listing)</option>
                                    {properties.map(p => (
                                        <option key={p._id} value={p._id}>
                                            {p.title} - {formatINR(p.price)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>
                                        Initial Stage
                                    </label>
                                    <select 
                                        className="input-control"
                                        value={newLeadForm.status}
                                        onChange={(e) => setNewLeadForm(prev => ({ ...prev, status: e.target.value }))}
                                        style={{ background: 'var(--surface)', color: 'var(--text)' }}
                                    >
                                        {STAGES.map(s => (
                                            <option key={s.id} value={s.id}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>
                                        Lead Source
                                    </label>
                                    <select 
                                        className="input-control"
                                        value={newLeadForm.source}
                                        onChange={(e) => setNewLeadForm(prev => ({ ...prev, source: e.target.value }))}
                                        style={{ background: 'var(--surface)', color: 'var(--text)' }}
                                    >
                                        <option value="Direct">Direct</option>
                                        <option value="Facebook Ads">Facebook Ads</option>
                                        <option value="Organic Search">Organic Search</option>
                                        <option value="Realtor.com">Realtor.com</option>
                                        <option value="Zillow Premium">Zillow Premium</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>
                                    Requirements / Message
                                </label>
                                <textarea 
                                    className="input-control"
                                    rows="2"
                                    placeholder="Buyer requirements, preferred budget, location..."
                                    value={newLeadForm.message}
                                    onChange={(e) => setNewLeadForm(prev => ({ ...prev, message: e.target.value }))}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                                <button 
                                    type="button" 
                                    className="btn btn-outline" 
                                    style={{ flex: 1 }}
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    style={{ flex: 1 }}
                                    disabled={creatingLead}
                                >
                                    {creatingLead ? 'Creating...' : 'Add to Pipeline'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesPipeline;
