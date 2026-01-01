import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Index from './pages/Index';
import AddNewProject from './pages/AddNewProject';
import ProjectsInProgress from './pages/ProjectsInProgress';
import FinishedProjects from './pages/FinishedProjects';
import ProjectDetail from './pages/ProjectDetail';
import EditProject from './pages/EditProject'; // Imported EditProject
import Login from './pages/Login';
import Logout from './pages/Logout';
import Registration from './pages/Registration';
import ChangePassword from './pages/ChangePassword';

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex justify-center items-center h-screen">
          <div className="text-lg">Nalagam...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated() ? <Index /> : <Navigate to="/Login" />} />
      <Route path="/AddNewProject" element={isAuthenticated() ? <AddNewProject />: <Navigate to="/Login" /> } />
      <Route path="/ProjectsInProgress" element={isAuthenticated() ? <ProjectsInProgress />: <Navigate to="/Login" />} />
      <Route path="/FinishedProjects" element={isAuthenticated() ? <FinishedProjects />: <Navigate to="/Login" />} />
      <Route path="/project/:projectId" element={isAuthenticated() ? <ProjectDetail /> : <Navigate to="/Login" />} />
      <Route path="/project/:projectId/edit" element={isAuthenticated() ? <EditProject /> : <Navigate to="/Login" />} />

      <Route path="/Login" element={<Login />} />
      <Route path="/Logout" element={<Logout />} />
      <Route path="/Registration" element={<Registration />} />
      <Route path="/ChangePassword" element={isAuthenticated() ? <ChangePassword /> : <Navigate to="/Login" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;