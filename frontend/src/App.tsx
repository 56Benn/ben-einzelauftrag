import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import StudentDashboard from '@/pages/StudentDashboard';
import Profile from '@/pages/Profile';
import Leaderboard from '@/pages/Leaderboard';
import TeacherDashboard from '@/pages/TeacherDashboard';
import ClassManagement from '@/pages/ClassManagement';
import StudentDetail from '@/pages/StudentDetail';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function StudentRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.role === 'student' ? <>{children}</> : <Navigate to="/" replace />;
}

function TeacherRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.role === 'teacher' ? <>{children}</> : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              {user?.role === 'student' ? <StudentDashboard /> : <TeacherDashboard />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <StudentRoute>
              <Layout>
                <Leaderboard />
              </Layout>
            </StudentRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <StudentRoute>
              <Layout>
                <Profile />
              </Layout>
            </StudentRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/class"
        element={
          <ProtectedRoute>
            <TeacherRoute>
              <Layout>
                <ClassManagement />
              </Layout>
            </TeacherRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/class/student/:studentId"
        element={
          <ProtectedRoute>
            <TeacherRoute>
              <Layout>
                <StudentDetail />
              </Layout>
            </TeacherRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;


