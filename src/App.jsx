import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AddBookPage from './pages/AddBookPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import CommunityPage from './pages/CommunityPage';
import PublicProfilePage from './pages/PublicProfilePage';
import LandingPage from './pages/LandingPage';
import AdminPage from './pages/AdminPage';
import OrganizationsPage from './pages/OrganizationsPage';
import CreateOrganizationPage from './pages/CreateOrganizationPage';
import OrganizationProfilePage from './pages/OrganizationProfilePage';
import OrganizationChatPage from './pages/OrganizationChatPage';
import OrganizationManagePage from './pages/OrganizationManagePage';
import { ToastProvider } from './context/ToastContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppContent = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const showNavbar = user && location.pathname !== '/login' && location.pathname !== '/';

  // Show minimal loading state while auth initializes
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui' }}>
        Loading...
      </div>
    );
  }

  return (
    <div id="app">
      <div className="page-content" style={{ paddingBottom: showNavbar ? '80px' : '0' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/add" element={
            <ProtectedRoute>
              <AddBookPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/community" element={
            <ProtectedRoute>
              <CommunityPage />
            </ProtectedRoute>
          } />
          <Route path="/user/:userId" element={
            <ProtectedRoute>
              <PublicProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/organizations" element={
            <ProtectedRoute>
              <OrganizationsPage />
            </ProtectedRoute>
          } />
          <Route path="/organizations/create" element={
            <ProtectedRoute>
              <CreateOrganizationPage />
            </ProtectedRoute>
          } />
          <Route path="/organizations/:id" element={
            <ProtectedRoute>
              <OrganizationProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/organizations/:id/chat" element={
            <ProtectedRoute>
              <OrganizationChatPage />
            </ProtectedRoute>
          } />
          <Route path="/organizations/:id/manage" element={
            <ProtectedRoute>
              <OrganizationManagePage />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
      {showNavbar && <Navbar />}
    </div>
  );
};



const App = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
