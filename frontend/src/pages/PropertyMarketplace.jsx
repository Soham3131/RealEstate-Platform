import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL, { BACKEND_URL } from '../apiConfig';
import { Search, MapPin, Home, Heart, ArrowRight, Bed, Bath, Bot, TrendingUp, TrendingDown, Cuboid } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ScheduleTourModal from '../components/common/ScheduleTourModal';
import {
    STATE_OPTIONS,
    getCitiesForState,
    inferCityFromProperty,
    inferStateFromProperty,
} from '../data/locationHierarchy';

const formatINR = (num) => {
    if (!num) return '---';
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
    return `₹${num.toLocaleString('en-IN')}`;
};

const getVerdict = (listedPrice, aiPrice) => {
    if (!aiPrice || !listedPrice) return null;
    const diff = ((listedPrice - aiPrice) / aiPrice * 100);
    if (diff > 15) return { label: 'OVERPRICED', color: '#ef4444', bg: '#fef2f2', icon: TrendingUp, diff: diff.toFixed(0) };
    if (diff < -10) return { label: 'GREAT DEAL', color: '#22c55e', bg: '#f0fdf4', icon: TrendingDown, diff: diff.toFixed(0) };
    return { label: 'FAIR PRICE', color: '#f59e0b', bg: '#fffbeb', icon: Bot, diff: diff.toFixed(0) };
};

const PLACEHOLDER_IMAGE =
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
                    <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stop-color="#f8fafc"/>
                            <stop offset="100%" stop-color="#e2e8f0"/>
                        </linearGradient>
                    </defs>
                    <rect width="1200" height="800" fill="url(#g)"/>
                    <rect x="260" y="210" width="680" height="360" fill="none" stroke="#cbd5e1" stroke-width="6"/>
                    <path d="M360 520 L500 400 L620 500 L710 420 L860 520" fill="none" stroke="#94a3b8" stroke-width="10" stroke-linecap="square" stroke-linejoin="miter"/>
                    <circle cx="485" cy="350" r="30" fill="none" stroke="#94a3b8" stroke-width="10"/>
                    <text x="600" y="650" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#64748b">Image unavailable</text>
                </svg>
        `);

const PropertyMarketplace = ({ compact = false }) => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savedIds, setSavedIds] = useState([]);
    const [tourProperty, setTourProperty] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [filters, setFilters] = useState({
        state: '',
        city: '',
        location: '',
        type: '',
        agency: '',
        minPrice: '',
        maxPrice: ''
    });

    const allCities = Array.from(new Set(STATE_OPTIONS.flatMap((state) => getCitiesForState(state))));

    useEffect(() => {
        fetchInitialData();
        if (user) fetchSavedProperties();
    }, [user]);

    useEffect(() => {
        if (compact) return;

        const params = new URLSearchParams(location.search);
        const stateFromQuery = params.get('state') || '';
        const cityFromQuery = params.get('city') || '';
        const locationFromQuery = params.get('location') || '';
        const typeFromQuery = params.get('type') || '';
        const minPriceFromQuery = params.get('minPrice') || '';
        const maxPriceFromQuery = params.get('maxPrice') || '';

        const sanitizedState = STATE_OPTIONS.includes(stateFromQuery) ? stateFromQuery : '';
        const allowedCities = sanitizedState ? getCitiesForState(sanitizedState) : allCities;
        const sanitizedCity = cityFromQuery && allowedCities.includes(cityFromQuery) ? cityFromQuery : '';

        setFilters((prev) => ({
            ...prev,
            state: sanitizedState,
            city: sanitizedCity,
            location: locationFromQuery,
            type: typeFromQuery,
            minPrice: minPriceFromQuery,
            maxPrice: maxPriceFromQuery,
        }));
    }, [location.search, compact]);

    const fetchInitialData = async () => {
        try {
            const propRes = await axios.get(`${API_BASE_URL}/properties`);
            setProperties(propRes.data);
            setLoading(false);

            // Trigger batch AI estimation for properties missing estimates (fire-and-forget)
            const missingIds = propRes.data
                .filter(p => !p.aiEstimation?.estimatedPrice && p.location && p.size)
                .map(p => p._id);
            if (missingIds.length > 0 && user) {
                axios.post(`${API_BASE_URL}/estimation/batch-property-estimate`, { propertyIds: missingIds })
                    .then(({ data }) => {
                        if (data.estimated > 0) {
                            // Re-fetch to get updated estimates
                            axios.get(`${API_BASE_URL}/properties`).then(res => setProperties(res.data));
                        }
                    })
                    .catch(() => {});
            }
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const fetchSavedProperties = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/auth/me`);
            setSavedIds(data.savedProperties.map(p => p._id || p));
        } catch (error) {
            console.error(error);
        }
    };

    const toggleSave = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return navigate('/login');

        try {
            const { data } = await axios.post(`${API_BASE_URL}/auth/save-property/${id}`);
            setSavedIds(data);
        } catch (error) {
            console.error(error);
        }
    };

    const availableCities = filters.state ? getCitiesForState(filters.state) : allCities;

    const handleSearch = () => {
        if (compact) return;

        const params = new URLSearchParams();
        if (filters.state) params.set('state', filters.state);
        if (filters.city) params.set('city', filters.city);
        if (filters.location.trim()) params.set('location', filters.location.trim());
        if (filters.type) params.set('type', filters.type);
        if (filters.minPrice) params.set('minPrice', filters.minPrice);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);

        navigate(params.toString() ? `/marketplace?${params.toString()}` : '/marketplace', { replace: true });
    };

    const filteredProperties = properties.filter(p => {
        const agencyMatch = filters.agency === '' || p.agency?._id === filters.agency;
        const searchText = filters.location.trim().toLowerCase();
        const searchableText = [
            p.title,
            p.location,
            p.city,
            p.state,
            p.builder,
            p.propertyType,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        const searchTokens = searchText.split(/[\s,]+/).filter(Boolean);
        const locationMatch =
            searchText === '' ||
            searchableText.includes(searchText) ||
            searchTokens.every(token => searchableText.includes(token));
        const typeMatch = filters.type === '' || p.propertyType === filters.type;
        const priceMatch = (filters.minPrice === '' || p.price >= Number(filters.minPrice)) && (filters.maxPrice === '' || p.price <= Number(filters.maxPrice));
        const propertyState = inferStateFromProperty(p);
        const propertyCity = inferCityFromProperty(p);
        const stateMatch = filters.state === '' || propertyState.toLowerCase() === filters.state.toLowerCase();
        const cityMatch = filters.city === '' || propertyCity.toLowerCase() === filters.city.toLowerCase();
        
        return agencyMatch && locationMatch && typeMatch && priceMatch && stateMatch && cityMatch && p.status !== 'Blocked' && p.isApproved;
    });

    const getImageUrl = (url) => {
        if (!url) return PLACEHOLDER_IMAGE;
        if (url.startsWith('http')) {
            if (window.location.hostname !== 'localhost' && url.includes('localhost:5000')) {
                return url.replace('http://localhost:5000', BACKEND_URL);
            }
            return url;
        }
        return `${BACKEND_URL}${url}`;
    };

    const handleImageError = (event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = PLACEHOLDER_IMAGE;
    };

    return (
        <div className="section container animate-fade">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '1rem',
                flexWrap: 'wrap',
                marginBottom: compact ? '1.25rem' : '1.75rem'
            }}>
                <div>
                    <p className="eyebrow">Curated Search</p>
                    <h2 style={{ fontSize: compact ? '1.5rem' : 'clamp(1.5rem, 6vw, 2.75rem)', fontWeight: '700', margin: 0 }}>
                        {compact ? 'Browse' : 'Global'} <span className="text-gradient">Marketplace</span>
                    </h2>
                    {!compact && <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Discover premium real estate opportunities</p>}
                </div>
            </div>

            <div className="search-bar-shell" style={{ marginBottom: '1.5rem' }}>
                <div className="search-bar-grid">
                    <select
                        className="search-bar-select"
                        value={filters.state}
                        onChange={(e) => setFilters({ ...filters, state: e.target.value, city: '' })}
                    >
                        <option value="">Select State</option>
                        {STATE_OPTIONS.map((state) => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>

                    <select
                        className="search-bar-select"
                        value={filters.city}
                        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    >
                        <option value="">Select City</option>
                        {availableCities.map((city) => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', gridColumn: '1 / -1' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            className="search-bar-input"
                            placeholder="Search locality, project, builder"
                            value={filters.location}
                            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                        />
                    </div>

                    <button
                        type="button"
                        className="search-bar-submit"
                        onClick={handleSearch}
                    >
                        Search
                    </button>
                </div>

                <div className="state-chip-row" aria-label="Marketplace states">
                    {['All', ...STATE_OPTIONS].map((state) => (
                        <button
                            key={state}
                            type="button"
                            className={`state-chip ${filters.state === state || (state === 'All' && !filters.state) ? 'state-chip--active' : ''}`}
                            onClick={() => setFilters({ ...filters, state: state === 'All' ? '' : state, city: '' })}
                        >
                            {state}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <select
                        className="search-bar-select"
                        style={{ flex: '1 1 180px' }}
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    >
                        <option value="">All Types</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Villa">Villa</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Land">Land</option>
                    </select>

                    <input
                        className="search-bar-input"
                        style={{ flex: '1 1 180px' }}
                        type="number"
                        placeholder="Min Price"
                        value={filters.minPrice}
                        onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    />

                    <input
                        className="search-bar-input"
                        style={{ flex: '1 1 180px' }}
                        type="number"
                        placeholder="Max Price"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem' }}>
                    <div className="animate-pulse" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Scanning marketplace...</div>
                </div>
            ) : (
                <div className={compact ? 'mp-grid mp-grid--compact' : 'mp-grid'}>
                    {filteredProperties.map(property => {
                        const isSaved = savedIds.includes(property._id);
                        return (
                             <div key={property._id} className="glass-card animate-fade" style={{ 
                                 position: 'relative', 
                                 background: 'var(--surface)', 
                                 border: '1px solid var(--border)', 
                                 padding: compact ? '1rem' : '1.2rem',
                                 borderRadius: '3px',
                                 boxShadow: 'var(--shadow)',
                                 display: 'flex',
                                 flexDirection: 'column'
                             }}>
                                <div style={{ 
                                    height: compact ? '180px' : '240px', 
                                    borderRadius: '3px', 
                                    overflow: 'hidden', 
                                    marginBottom: '1.2rem', 
                                    position: 'relative' 
                                }}>
                                    <img src={getImageUrl(property.images?.[0])} onError={handleImageError} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    <button 
                                        onClick={(e) => toggleSave(e, property._id)}
                                        style={{ 
                                            position: 'absolute', 
                                            top: '12px', 
                                            right: '12px', 
                                            background: 'rgba(255,255,255,0.2)', 
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.3)', 
                                            borderRadius: '3px', 
                                            width: '40px', 
                                            height: '40px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            cursor: 'pointer', 
                                            transition: '0.3s',
                                            color: 'white'
                                        }}
                                    >
                                        <Heart size={20} fill={isSaved ? 'var(--primary)' : 'none'} color={isSaved ? 'var(--primary)' : 'white'} />
                                    </button>
                                    <div style={{ 
                                        position: 'absolute', 
                                        bottom: '12px', 
                                        left: '12px', 
                                        background: 'var(--primary)', 
                                        color: 'white', 
                                        padding: '5px 12px', 
                                        borderRadius: '3px', 
                                        fontSize: '0.65rem', 
                                        fontWeight: '800',
                                        letterSpacing: '0.5px',
                                        boxShadow: '0 4px 10px rgba(229, 90, 22, 0.3)'
                                    }}>
                                        {property.status.toUpperCase()}
                                    </div>
                                </div>
                                 <div className="mp-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem', gap: '10px' }}>
                                    <div className="mp-card-header__left" style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>{property.propertyType}</div>
                                        <h3 style={{
                                            fontSize: compact ? '1.15rem' : '1.35rem',
                                            fontWeight: '800',
                                            margin: 0,
                                            color: 'var(--text)',
                                            lineHeight: '1.2'
                                        }}>{property.title}</h3>
                                    </div>
                                    <div className="mp-card-header__right" style={{ textAlign: 'right', flexShrink: 0, minWidth: 0 }}>
                                        <div style={{ fontSize: compact ? '1.2rem' : '1.5rem', fontWeight: '900', color: 'var(--text)', lineHeight: '1', whiteSpace: 'nowrap' }}>
                                            {formatINR(property.price)}
                                        </div>
                                        {property.aiEstimation?.estimatedPrice > 0 && (
                                            <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                                                <Bot size={11} /> AI: {formatINR(property.aiEstimation.estimatedPrice)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {(() => {
                                    const v = getVerdict(property.price, property.aiEstimation?.estimatedPrice);
                                    if (!v) return null;
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.6rem' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: v.bg, color: v.color, padding: '3px 8px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: '800' }}>
                                                <v.icon size={10} /> {v.label}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                {v.diff > 0 ? '+' : ''}{v.diff}% vs AI estimate
                                            </span>
                                        </div>
                                    );
                                })()}
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
                                    <MapPin size={14} color="var(--primary)" /> 
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{property.location}</span>
                                </div>

                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    padding: '1rem 0',
                                    borderTop: '1px solid var(--border)',
                                    marginBottom: '1.2rem',
                                    gap: '10px'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)', fontWeight: '700', fontSize: '0.9rem' }}>
                                            <Bed size={16} color="var(--primary)" /> {property.bedrooms || 0}
                                        </div>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Beds</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)', fontWeight: '700', fontSize: '0.9rem' }}>
                                            <Bath size={16} color="var(--primary)" /> {property.bathrooms || 0}
                                        </div>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Baths</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)', fontWeight: '700', fontSize: '0.9rem' }}>
                                            <Home size={16} color="var(--primary)" /> {property.size}
                                        </div>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>SQFT</span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    <Link to={`/property/${property._id}`} className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', borderRadius: '14px', fontSize: '0.95rem', fontWeight: '800' }}>
                                        View Details <ArrowRight size={18} />
                                    </Link>
                                    <Link
                                        to={`/property/${property._id}?tour3d=1`}
                                        className="btn btn-outline"
                                        style={{ width: '100%', padding: '0.9rem', borderRadius: '14px', fontSize: '0.95rem', fontWeight: '800' }}
                                    >
                                        <Cuboid size={18} /> View 3D Tour
                                    </Link>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        style={{ width: '100%', padding: '0.9rem', borderRadius: '14px', fontSize: '0.95rem', fontWeight: '800' }}
                                        onClick={() => setTourProperty(property)}
                                    >
                                        Schedule a Tour
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
             {filteredProperties.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px' }}>
                    <Home size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.2 }} />
                    <h3 style={{ color: 'var(--text)', fontWeight: '800' }}>No properties match your current filters</h3>
                    <button className="btn btn-outline" style={{ marginTop: '1rem', borderColor: 'var(--border)', color: 'var(--text-muted)' }} onClick={() => setFilters({state: '', city: '', location: '', type: '', agency: '', minPrice: '', maxPrice: ''})}>Reset Filters</button>
                </div>
            )}

            <ScheduleTourModal
                open={Boolean(tourProperty)}
                property={tourProperty}
                onClose={() => setTourProperty(null)}
            />
        </div>
    );
};

export default PropertyMarketplace;
