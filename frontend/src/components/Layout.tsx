import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { User, LogOut, ClipboardList, Trophy, FileText, LayoutDashboard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="w-10 h-10 object-contain transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 shadow-sm hidden group-hover:bg-slate-200 transition-colors">
                  <span className="text-lg font-semibold text-slate-600">P</span>
                </div>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2.5 group ${
                      active
                        ? 'text-blue-600 bg-blue-50 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon 
                      size={18} 
                      className={`transition-transform duration-200 ${
                        active ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700 group-hover:scale-110'
                      }`} 
                    />
                    <span className={active ? 'font-semibold' : ''}>{item.label}</span>
                    {active && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2.5 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-default">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <User size={16} className="text-slate-600" />
                </div>
                <span className="font-medium text-sm hidden sm:block text-slate-800">{user.username}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 hover:bg-red-50 hover:text-red-600 text-slate-600 transition-colors duration-200"
                title="Abmelden"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}


