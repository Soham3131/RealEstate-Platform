import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Search, LogOut, User, Moon, Sun, CheckCircle, X as CloseIcon, Menu, Phone, Mail, MapPin, Globe, ChevronDown, Bell, Home, LayoutGrid, Info, FileText, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
    const { user, logout, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [entranceDone, setEntranceDone] = useState(false);
    const isHomePage = location.pathname === '/';

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Always track scroll position for the white-background toggle.
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        // Fallback in case onAnimationEnd never fires (reduced-motion users,
        // browser quirks, etc.) — guarantees the entrance class drops so the
        // hide/show transitions aren't blocked by the animation's forwards fill.
        const t = setTimeout(() => setEntranceDone(true), 1000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        // Past-hero auto-hide. Only applies on the home page — everywhere else
        // the navbar stays visible because there's no hero to scroll past.
        if (!isHomePage) {
            setHidden(false);
            return;
        }

        let hideTimer = null;

        // Hero is `minHeight: 100vh` on the home page, so "past hero" ≈
        // scrollY past viewport height (with a small buffer).
        const isPastHero = () => window.scrollY > window.innerHeight - 100;

        const startHideTimer = () => {
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(() => {
                if (isPastHero()) setHidden(true);
            }, 1000);
        };

        const onScroll = () => {
            if (!isPastHero()) {
                setHidden(false);
                if (hideTimer) {
                    clearTimeout(hideTimer);
                    hideTimer = null;
                }
            } else {
                setHidden(false);
                startHideTimer();
            }
        };

        const onMouseMove = (e) => {
            if (!isPastHero()) return;
            if (e.clientY < 80) {
                setHidden(false);
                if (hideTimer) {
                    clearTimeout(hideTimer);
                    hideTimer = null;
                }
            } else if (e.clientY > 120) {
                startHideTimer();
            }
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        document.addEventListener('mousemove', onMouseMove);

        return () => {
            window.removeEventListener('scroll', onScroll);
            document.removeEventListener('mousemove', onMouseMove);
            if (hideTimer) clearTimeout(hideTimer);
        };
    }, [isHomePage]);

    const fetchUnreadCount = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/notifications`);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    useEffect(() => {
        if (user && !location.pathname.startsWith('/dashboard')) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user, location.pathname]);

    // Close menu when location changes or screen size becomes desktop
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location, windowWidth]);



    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return null;
    if (location.pathname.startsWith('/dashboard')) return null;

    const isMobile = windowWidth <= 768;
    const navHeight = isMobile ? '48px' : '60px';
    const isHome = location.pathname === '/';
    const transparent = isHome && !scrolled;
    const navTextColor = transparent ? '#FFFFFF' : '#0F172A';

    return (
        <>
            <nav
                className={entranceDone ? '' : 'nav-slide-down'}
                onAnimationEnd={(e) => {
                    if (e.animationName === 'navSlideDown') setEntranceDone(true);
                }}
                style={{
                    height: navHeight,
                    width: '100%',
                    left: 0,
                    right: 0,
                    display: 'flex',
                    alignItems: 'center',
                    position: 'fixed',
                    top: 0,
                    zIndex: 1000,
                    background: transparent ? 'transparent' : '#fff',
                    backdropFilter: transparent ? 'none' : 'blur(20px)',
                    borderBottom: 'none',
                    boxShadow: transparent ? 'none' : '0 2px 20px rgba(0,0,0,0.08)',
                    transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease',
                    boxSizing: 'border-box'
                }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px', maxWidth: 'none', padding: isMobile ? '0 0.75rem' : '0 1.25rem' }}>
                    {/* Logo Section */}
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', flexShrink: 1, minWidth: 0 }}>
                        <div style={{
                            width: isMobile ? '30px' : '38px',
                            height: isMobile ? '30px' : '38px',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{
                                fontSize: isMobile ? '0.98rem' : '1.2rem',
                                fontWeight: '800',
                                color: navTextColor,
                                lineHeight: '1.1',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                Millionaire <span style={{ color: 'var(--primary)' }}>Club</span>
                            </div>
                        </div>
                    </Link>
                    
                    {/* Actions Section - Desktop */}
                    <div className="desktop-only" style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexShrink: 0 }}>
                        <Link to="/marketplace" style={{
                            textDecoration: 'none',
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: navTextColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            paddingBottom: '2px'
                        }}>
                            <Search size={18} /> Find Property
                        </Link>

                        <Link to="/about" style={{
                            textDecoration: 'none',
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: navTextColor,
                            paddingBottom: '2px'
                        }}>
                            About Us
                        </Link>

                        {user && (
                            <Link to={user.role === 'Buyer' ? '/dashboard/user/dashboard' : `/dashboard/${user.role.toLowerCase()}`} style={{
                                textDecoration: 'none',
                                fontSize: '1rem',
                                fontWeight: '700',
                                color: navTextColor,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                paddingBottom: '2px'
                            }}>
                                <LayoutDashboard size={18} /> Dashboard
                            </Link>
                        )}

                        {user && (
                            <button
                                onClick={() => navigate(`/dashboard/${user.role.toLowerCase()}/notifications`)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: unreadCount > 0 ? 'var(--primary)' : navTextColor,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '8px',
                                    position: 'relative'
                                }}
                                title="Notifications"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: '4px', 
                                        right: '4px', 
                                        minWidth: '16px', 
                                        height: '16px', 
                                        background: 'var(--primary)', 
                                        color: 'white',
                                        borderRadius: '3px', 
                                        fontSize: '0.6rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '800',
                                        border: '1.5px solid var(--header-bg)'
                                    }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </div>
                                )}
                            </button>
                        )}

                        <button
                            onClick={toggleTheme}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: navTextColor,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px',
                                transition: 'var(--transition)'
                            }}
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                                <Link to={user.role === 'Buyer' ? '/dashboard/user/dashboard' : `/dashboard/${user.role.toLowerCase()}`} style={{ width: '40px', height: '40px', borderRadius: '3px', overflow: 'hidden', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    <div style={{ width: '100%', height: '100%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F172A', fontWeight: '800' }}>
                                        {user.name.slice(0,1).toUpperCase()}
                                    </div>
                                </Link>
                                <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: navTextColor, cursor: 'pointer' }}>
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                <Link to="/login" style={{
                                    textDecoration: 'none',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    color: navTextColor,
                                    paddingBottom: '2px'
                                }}>
                                    Login
                                </Link>
                                <Link to="/register" className="btn btn-primary" style={{ padding: '0.55rem 1.6rem', fontSize: '0.85rem', borderRadius: '3px', fontWeight: '800', textDecoration: 'none', color: '#0F172A' }}>
                                    Join Now
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle & Theme Button */}
                    <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {user && (
                            <button
                                onClick={() => navigate(`/dashboard/${user.role.toLowerCase()}/notifications`)}
                                style={{
                                    background: transparent ? 'rgba(255,255,255,0.85)' : 'var(--surface-light)',
                                    border: '1px solid var(--border)',
                                    color: unreadCount > 0 ? 'var(--primary)' : navTextColor,
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '3px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    position: 'relative'
                                }}
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-2px',
                                        right: '-2px',
                                        width: '8px',
                                        height: '8px',
                                        background: 'var(--primary)',
                                        borderRadius: '3px',
                                        border: '1.5px solid #fff'
                                    }} />
                                )}
                            </button>
                        )}
                         <button
                            onClick={toggleTheme}
                            style={{
                                background: transparent ? 'rgba(255,255,255,0.85)' : 'var(--surface-light)',
                                border: '1px solid var(--border)',
                                color: navTextColor,
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '3px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button 
                            onClick={() => setIsMenuOpen(true)}
                            style={{ 
                                background: 'var(--primary)', 
                                border: 'none', 
                                color: 'white', 
                                cursor: 'pointer', 
                                padding: '8px',
                                borderRadius: '3px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Menu size={22} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Layout Spacer - skipped on home so the navbar overlays the hero */}
            {!isHome && <div style={{ height: navHeight, width: '100%' }} />}

            {/* Mobile Sidebar Menu */}
            <div 
                className={`mobile-only mobile-overlay ${isMenuOpen ? 'active' : ''}`} 
                onClick={() => setIsMenuOpen(false)}
                style={{ zIndex: 1100 }}
            />
            
            <div className={`mobile-only mobile-menu ${isMenuOpen ? 'active' : ''}`} style={{ zIndex: 1200, paddingTop: '1rem', fontFamily: 'var(--font-sans)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 1.5rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '3px' }} />
                        <span style={{ fontWeight: '800', fontSize: '1rem' }}>Millionaire Club</span>
                    </div>
                    <button onClick={() => setIsMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                        <CloseIcon size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', opacity: 0.8 }}>Explore Millionaire Club</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Link to="/" className="mobile-menu-item">
                            <Home size={20} /> Home
                        </Link>
                        <Link to="/marketplace" className="mobile-menu-item">
                            <LayoutGrid size={20} /> Properties
                        </Link>
                        <Link to="/about" className="mobile-menu-item">
                            <Info size={20} /> About Us
                        </Link>
                    </div>
                </div>
                
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', opacity: 0.8 }}>Account</div>
                    {user ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Link to={user.role === 'Buyer' ? '/dashboard/user/dashboard' : `/dashboard/${user.role.toLowerCase()}`} className="mobile-menu-item">
                                <User size={20} /> My Dashboard
                            </Link>

                            <button onClick={handleLogout} className="mobile-menu-item" style={{ border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', background: 'var(--surface-light)' }}>
                                <LogOut size={20} /> Logout
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Link to="/login" className="mobile-menu-item" style={{ background: 'var(--surface-light)' }}>
                                <User size={20} /> Login
                            </Link>
                            <Link to="/register" className="btn btn-primary" style={{ padding: '1.2rem', borderRadius: '3px', fontSize: '1rem', textDecoration: 'none', textAlign: 'center', fontWeight: '800' }}>Join Now</Link>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 'auto', padding: '1.5rem', background: 'var(--surface-light)', borderRadius: '3px', textAlign: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Expertly Curated</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--text)' }}>
                        Millionaire <span style={{ color: 'var(--primary)' }}>Club</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
