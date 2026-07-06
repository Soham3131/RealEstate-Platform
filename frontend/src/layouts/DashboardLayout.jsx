import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Building2, TrendingUp, Users, Settings, LogOut,
    ChevronRight, MessageCircle, Home, Search, Bell, Sun, Moon, Plus,
    FileText, BarChart3, X as CloseIcon, Menu, Calculator, GitCompare, Truck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DashboardLayout = () => {
    const { user, logout, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
        // Only fetch after loading is done AND user is confirmed (token in localStorage)
        if (!loading && user) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000); // Check every 30s
            return () => clearInterval(interval);
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);

    const fetchUnreadCount = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/notifications`);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a' }}>
            <div className="animate-pulse" style={{ color: 'var(--primary)', fontWeight: '700' }}>Authenticating Hub...</div>
        </div>
    );

    if (!user) return null;

    const menuItems = {
        agency: [
            { label: 'Dashboard', path: '/dashboard/agency', icon: LayoutDashboard },
            { label: 'Inventory', path: '/dashboard/agency/properties', icon: Building2 },
            { label: 'Add Property', path: '/dashboard/agency/properties/add', icon: Plus },
            { label: 'CRM Pipeline', path: '/dashboard/agency/leads/pipeline', icon: TrendingUp },
            { label: 'All Leads', path: '/dashboard/agency/leads', icon: Users },
            { section: 'AI Insights' },
            { label: 'Price Intelligence', path: '/dashboard/agency/price-intelligence', icon: Calculator, indent: true },
            { label: 'Compare Properties', path: '/dashboard/agency/compare', icon: GitCompare, indent: true },
            { label: 'Notifications', path: '/dashboard/agency/notifications', icon: Bell },
            { label: 'My Profile', path: '/dashboard/agency/profile', icon: Users },
            { label: 'Settings', path: '/dashboard/agency/settings', icon: Settings },
        ],
        investor: [
            { label: 'Dashboard', path: '/dashboard/investor', icon: LayoutDashboard },
            { section: 'Account Portfolio' },
            { label: 'All Investments', path: '/dashboard/investor/investments', icon: TrendingUp, indent: true },
            { label: 'Add Investment', path: '/dashboard/investor/add-investment', icon: Plus, indent: true },
            { label: 'Notifications', path: '/dashboard/investor/notifications', icon: Bell },
            { label: 'Documents', path: '/dashboard/investor/docs', icon: FileText },
            { label: 'Analytics', path: '/dashboard/investor/analytics', icon: BarChart3 },
            { section: 'AI Insights' },
            { label: 'Price Intelligence', path: '/dashboard/investor/price-intelligence', icon: Calculator, indent: true },
            { label: 'Compare Properties', path: '/dashboard/investor/compare', icon: GitCompare, indent: true },
            { label: 'Profile', path: '/dashboard/investor/profile', icon: Users },
            { label: 'Settings', path: '/dashboard/investor/settings', icon: Settings },
        ],
        buyer: [
            { label: 'Dashboard', path: '/dashboard/user/dashboard', icon: LayoutDashboard },
            { label: 'Browse', path: '/dashboard/user/browse', icon: Search },
            { label: 'Notifications', path: '/dashboard/user/notifications', icon: Bell },
            { label: 'Saved', path: '/dashboard/user/saved', icon: Building2 },
            { label: 'Enquiries', path: '/dashboard/user/enquiries', icon: Users },
            { section: 'AI Insights' },
            { label: 'Price Intelligence', path: '/dashboard/buyer/price-intelligence', icon: Calculator, indent: true },
            { label: 'Compare Properties', path: '/dashboard/buyer/compare', icon: GitCompare, indent: true },
        ],
        admin: [
            { label: 'Overview', path: '/dashboard/admin', icon: LayoutDashboard },
            { label: 'Agencies', path: '/dashboard/admin/agencies', icon: Building2 },
            { label: 'Investors', path: '/dashboard/admin/investors', icon: TrendingUp },
            { label: 'Properties', path: '/dashboard/admin/properties', icon: Home },
            { label: 'Articles', path: '/dashboard/admin/articles', icon: FileText },
            { label: 'Leads', path: '/dashboard/admin/leads', icon: MessageCircle },
            { label: 'Movers Leads', path: '/dashboard/admin/movers-leads', icon: Truck },
            { label: 'Onboarding Tracker', path: '/dashboard/admin/tracker', icon: TrendingUp },
            { label: 'Users', path: '/dashboard/admin/users', icon: Users },
            { section: 'AI Insights' },
            { label: 'Price Intelligence', path: '/dashboard/admin/price-intelligence', icon: Calculator, indent: true },
            { label: 'Compare Properties', path: '/dashboard/admin/compare', icon: GitCompare, indent: true },
            { label: 'Notifications', path: '/dashboard/admin/notifications', icon: Bell },
            { label: 'Settings', path: '/dashboard/admin/settings', icon: Settings },
        ]
    };

    const currentItems = menuItems[user.role.toLowerCase()] || [];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)', color: 'var(--text)', position: 'relative' }}>
            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 1001,
                        backdropFilter: 'blur(4px)'
                    }}
                    className="mobile-only"
                />
            )}

            {/* Sidebar */}
            <aside style={{
                width: windowWidth <= 768 ? 'clamp(260px, 80vw, 300px)' : (isCollapsed ? '70px' : '230px'),
                minWidth: windowWidth <= 768 ? 'auto' : (isCollapsed ? '70px' : '230px'),
                background: 'var(--sidebar-bg)', 
                fontFamily: 'var(--font-sans)',
                display: 'flex', 
                flexDirection: 'column',
                borderRight: '1px solid var(--border)',
                position: windowWidth <= 768 ? 'fixed' : 'sticky',
                top: 0,
                bottom: 0,
                left: 0,
                height: '100vh',
                zIndex: 1002,
                transform: windowWidth <= 768 ? (sidebarOpen ? 'translateX(0)' : 'translateX(-101%)') : 'none',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'visible', // Allow toggle button to pop out
                boxShadow: windowWidth <= 768 && sidebarOpen ? '20px 0 50px rgba(0,0,0,0.5)' : 'none'
            }}>
                {/* Scrollable Content Wrapper */}
                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    overflowY: 'auto', 
                    overflowX: 'hidden',
                    height: '100%' 
                }}>
                    {/* Logo Area */}
                    <div style={{ 
                        padding: isCollapsed ? '1.5rem 0.5rem' : '1.5rem 1.5rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: isCollapsed ? '0' : '12px',
                        minHeight: '80px'
                    }}>
                        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '12px', textDecoration: 'none' }}>
                            <div style={{ 
                                width: '42px',
                                height: '42px',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#000',
                                flexShrink: 0,
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                transition: 'all 0.3s ease'
                            }}>
                                <img src="/logo.png" alt="Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                            </div>
                            {!isCollapsed && (
                                <div style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '0.2px', lineHeight: '1.2', flex: 1, color: 'var(--text)' }}>
                                    Millionaire <span style={{ color: 'var(--primary)' }}>Club</span>
                                </div>
                            )}
                        </Link>

                        <button className="mobile-only" onClick={() => setSidebarOpen(false)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                            <CloseIcon size={20} />
                        </button>
                    </div>

                    {/* Nav Links */}
                    <div style={{ 
                        flex: 1, 
                        padding: '0 0.8rem', 
                        marginTop: isCollapsed ? '30px' : '0',
                        transition: 'margin-top 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {currentItems.map((item, index) => {
                                if (item.section) {
                                    return !isCollapsed && (
                                        <div key={`sec-${index}`} style={{ padding: '1.2rem 1rem 0.5rem', fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {item.section}
                                        </div>
                                    );
                                }
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link 
                                        key={index} 
                                        to={item.path} 
                                        style={{ 
                                            textDecoration: 'none', 
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: isCollapsed ? '0.8rem' : '0.8rem 1.2rem',
                                            paddingLeft: item.indent && !isCollapsed ? '2.8rem' : (isCollapsed ? '0.8rem' : '1.2rem'),
                                            borderRadius: '10px',
                                            color: isActive ? 'white' : 'var(--text-muted)',
                                            background: isActive 
                                                ? 'linear-gradient(90deg, var(--primary) 0%, rgba(245, 158, 11, 0.8) 100%)' 
                                                : 'transparent',
                                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                                            marginBottom: '2px'
                                        }}
                                        title={isCollapsed ? item.label : ""}
                                    >
                                        <item.icon size={19} opacity={isActive ? 1 : 0.6} style={{ flexShrink: 0 }} />
                                        {!isCollapsed && <span style={{ fontWeight: isActive ? '700' : '500', fontSize: '0.9rem', letterSpacing: '0.3px' }}>{item.label}</span>}
                                        {isActive && (
                                            <div style={{ 
                                                position: 'absolute', 
                                                left: 0, 
                                                top: '15%', 
                                                bottom: '15%', 
                                                width: '4px', 
                                                background: 'white', 
                                                borderRadius: '0 4px 4px 0',
                                                boxShadow: '0 0 10px white'
                                            }} />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* User Profile */}
                    <div style={{ 
                        padding: isCollapsed ? '1.5rem 0.5rem' : '1.5rem', 
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: isCollapsed ? '0' : '12px'
                    }}>
                        <div style={{ 
                            width: '38px', 
                            height: '38px', 
                            borderRadius: '50%', 
                            background: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            flexShrink: 0
                        }}>
                            {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        {!isCollapsed && (
                            <>
                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                                </div>
                                <button onClick={logout} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <LogOut size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Desktop Collapse Toggle - Moved inside sidebar */}
                <button 
                    className="desktop-only"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    style={{ 
                        position: 'absolute',
                        right: isCollapsed ? 'auto' : '15px',
                        left: isCollapsed ? '50%' : 'auto',
                        top: isCollapsed ? '75px' : '48px',
                        transform: isCollapsed ? 'translateX(-50%)' : 'none',
                        background: 'var(--surface-light)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 1003,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--primary)';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = isCollapsed ? 'translateX(-50%) scale(1.1)' : 'scale(1.1)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'var(--surface-light)';
                        e.currentTarget.style.color = 'var(--text)';
                        e.currentTarget.style.transform = isCollapsed ? 'translateX(-50%) scale(1)' : 'scale(1)';
                    }}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />}
                </button>
            </aside>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%', maxWidth: '100%', overflowX: 'clip' }}>
                {/* HeaderBar */}
                <header style={{
                    height: '58px',
                    background: 'var(--header-bg)',
                    fontFamily: 'var(--font-sans)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 clamp(0.85rem, 4vw, 2rem)',
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button 
                            className="mobile-only"
                            onClick={() => setSidebarOpen(true)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}
                        >
                            <Menu size={24} />
                        </button>
                        <h2 style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {currentItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 15px)' }}>
                        {/* Theme Toggle */}
                        <button 
                            onClick={toggleTheme}
                            style={{ 
                                background: 'var(--surface-light)', 
                                border: '1px solid var(--border)', 
                                padding: '8px', 
                                borderRadius: '8px', 
                                color: 'var(--text)', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <div className="desktop-only" style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Search records..." 
                                style={{ 
                                    background: 'var(--input-bg)', 
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    padding: '8px 12px 8px 38px',
                                    color: 'var(--text)',
                                    fontSize: '0.85rem',
                                    width: '240px'
                                }}
                            />
                        </div>
                        <button 
                            onClick={() => navigate(`/dashboard/${user.role.toLowerCase()}/notifications`)}
                            style={{ background: 'var(--surface-light)', border: 'none', padding: '8px', borderRadius: '8px', color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', position: 'relative' }}
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '-4px', 
                                    right: '-4px', 
                                    minWidth: '18px', 
                                    height: '18px', 
                                    background: 'var(--primary)', 
                                    color: 'white',
                                    borderRadius: '50%', 
                                    fontSize: '0.65rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '800',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                    border: '2px solid var(--header-bg)'
                                }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </div>
                            )}
                        </button>
                    </div>
                </header>

                <main style={{ flex: 1, padding: windowWidth <= 480 ? '0.75rem' : 'clamp(1rem, 5vw, 2.5rem)', minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
                    <Outlet />
                </main>

                <footer className="dash-footer">
                    <div>Avani Enterprises - Millionaire Club © 2026</div>
                    {/* <div style={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}>Powered by DataStore Snapshot v2.0</div> */}
                </footer>
            </div>
        </div>
    );
};

export default DashboardLayout;
