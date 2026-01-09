import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, User } from 'lucide-react';
import { getRecentUsers } from '@/lib/storage';
import { User as UserType } from '@/types';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [recentUsers, setRecentUsers] = useState<UserType[]>([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setRecentUsers(getRecentUsers());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (login(email, password)) {
      navigate('/');
    } else {
      setError('Ungültige E-Mail oder Passwort');
    }
  };

  const handleQuickLogin = (user: UserType) => {
    setEmail(user.email);
    setPassword(user.password); // Pre-fill password for quick login
    setError('');
    // Auto-submit after a short delay for better UX
    setTimeout(() => {
      if (login(user.email, user.password)) {
        navigate('/');
      }
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-16 h-16 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm hidden">
              <span className="text-2xl font-semibold text-slate-600">P</span>
            </div>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">Anmelden</h1>
          <p className="text-slate-600 text-sm">Melden Sie sich mit Ihren Zugangsdaten an</p>
        </div>

        <Card className="bg-white border border-slate-200 shadow-lg">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-gray-900 text-sm">E-mail:</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="type value"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-gray-300 rounded-md h-11 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-bold text-gray-900 text-sm">Passwort:</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="type value"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-gray-300 rounded-md h-11 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                Senden
              </Button>
            </form>

            {/* Quick Login */}
            {recentUsers.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4 font-semibold">Schnell-Anmeldung:</p>
                <div className="space-y-2.5">
                  {recentUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickLogin(user)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-left transition-all duration-200 group"
                    >
                      <div className="w-9 h-9 rounded-full bg-gray-200 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <User size={16} className="text-gray-600 group-hover:text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-gray-600 text-sm">
          Noch kein Account? <span className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">Kontaktieren Sie den Administrator</span>
        </p>
      </div>
    </div>
  );
}

