import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Reservation from './pages/Reservation';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import Reviews from './pages/Reviews';
import WorkerSettings from './pages/WorkerSettings';
import WorkersMap from './pages/WorkersMap';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole } from './types';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user || user.role !== UserRole.ADMIN) return <Navigate to="/" />;
  return <>{children}</>;
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AppRoutes = () => {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route 
                    path="/reserve" 
                    element={
                        <PrivateRoute>
                            <Reservation />
                        </PrivateRoute>
                    } 
                />
                <Route 
                    path="/chat" 
                    element={
                        <PrivateRoute>
                            <Chat />
                        </PrivateRoute>
                    } 
                />
                 <Route 
                    path="/reviews" 
                    element={<Reviews />} 
                />
                <Route 
                    path="/workers-map" 
                    element={<WorkersMap />} 
                />
                <Route 
                    path="/profile" 
                    element={
                        <PrivateRoute>
                            <WorkerSettings />
                        </PrivateRoute>
                    } 
                />
                <Route 
                    path="/worker-settings" 
                    element={<Navigate to="/profile" />} 
                />
                <Route 
                    path="/admin" 
                    element={
                        <AdminRoute>
                            <Admin />
                        </AdminRoute>
                    } 
                />
            </Routes>
        </Layout>
    );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;