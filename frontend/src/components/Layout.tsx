import { ReactNode, useRef, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { User, LogOut, ClipboardList, Trophy, FileText, LayoutDashboard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar, Nav, Container } from 'react-bootstrap';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navbarRef = useRef<HTMLDivElement>(null);
  const [navbarHeight, setNavbarHeight] = useState(80);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const updateNavbarHeight = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.offsetHeight || navbarRef.current.clientHeight;
        if (height > 0) {
          setNavbarHeight(height);
        }
      }
    };
    
    // Initial measurement after render with multiple attempts
    const timeout1 = setTimeout(updateNavbarHeight, 0);
    const timeout2 = setTimeout(updateNavbarHeight, 100);
    const raf = requestAnimationFrame(() => {
      updateNavbarHeight();
    });
    
    // Also update on window resize
    window.addEventListener('resize', updateNavbarHeight);
    
    // Use MutationObserver to detect when navbar content changes (e.g., on mobile toggle)
    let observer: MutationObserver | null = null;
    if (navbarRef.current) {
      observer = new MutationObserver(updateNavbarHeight);
      observer.observe(navbarRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateNavbarHeight);
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  if (!user) return null;

  const studentNavItems = [
    { path: '/', label: 'Aktuelle Prüfungen', icon: ClipboardList },
    { path: '/leaderboard', label: 'Bestenliste', icon: Trophy },
    { path: '/profile', label: 'Übersicht', icon: FileText },
  ];

  const teacherNavItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/class', label: 'Klasse', icon: Users },
  ];

  const navItems = user.role === 'student' ? studentNavItems : teacherNavItems;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div ref={navbarRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1030 }}>
        <Navbar bg="white" expand="lg" className="border-b border-slate-200 shadow-sm">
          <Container className="px-6">
          {/* Logo */}
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center p-0 me-4" style={{ textDecoration: 'none' }}>
            <div className="position-relative">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="transition-transform duration-200"
                style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="bg-slate-100 rounded-lg d-flex align-items-center justify-content-center border border-slate-200 shadow-sm d-none" style={{ width: '2.5rem', height: '2.5rem' }}>
                <span className="text-lg font-semibold text-slate-600">P</span>
              </div>
            </div>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" aria-label="Toggle navigation" className="border-slate-300 d-lg-none" />
          <Navbar.Collapse id="basic-navbar-nav" className="d-lg-flex">
            <Nav className="me-auto d-flex flex-row">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Nav.Link
                    key={item.path}
                    as={Link}
                    to={item.path}
                    className={`relative px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 d-flex align-items-center ${
                      active
                        ? 'text-blue-600 bg-blue-50 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    style={{ gap: '0.625rem', textDecoration: 'none' }}
                  >
                    <Icon 
                      size={18} 
                      className={`transition-transform duration-200 ${
                        active ? 'text-blue-600' : 'text-slate-500'
                      }`} 
                    />
                    <span className={active ? 'font-semibold' : ''}>{item.label}</span>
                    {active && (
                      <div className="position-absolute bottom-0 start-50 translate-middle-x bg-blue-600 rounded-circle" style={{ width: '0.25rem', height: '0.25rem' }}></div>
                    )}
                  </Nav.Link>
                );
              })}
            </Nav>
            <Nav className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
              <div className="d-flex align-items-center text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors" style={{ gap: '0.625rem', cursor: 'default' }}>
                <div className="d-flex align-items-center justify-content-center rounded-circle bg-slate-100 border border-slate-200" style={{ width: '2rem', height: '2rem' }}>
                  <User size={16} className="text-slate-600" />
                </div>
                <span className="font-medium text-sm d-none d-sm-block text-slate-800">{user.username}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="hover:bg-red-50 hover:text-red-600 text-slate-600 transition-colors duration-200"
                style={{ width: '2rem', height: '2rem', padding: 0 }}
                title="Abmelden"
              >
                <LogOut size={16} />
              </Button>
            </Nav>
          </Navbar.Collapse>
          </Container>
        </Navbar>
      </div>

      {/* Main Content - Startet unter der fixierten Navbar */}
      <main className="container mx-auto px-6 py-8" style={{ marginTop: `${navbarHeight}px`, paddingTop: '2rem', position: 'relative', zIndex: 1, minHeight: `calc(100vh - ${navbarHeight}px - 2rem)` }}>
        {children}
      </main>
    </div>
  );
}
