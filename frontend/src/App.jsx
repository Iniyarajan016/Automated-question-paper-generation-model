import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import GeneratePaper from './pages/GeneratePaper';
import PaperPreview from './pages/PaperPreview';
import QuestionBank from './pages/QuestionBank';
import HistoryPage from './pages/History';
import SettingsPage from './pages/SettingsPage';
import AdminStaff from './pages/AdminStaff';
import DatasetManagement from './pages/DatasetManagement';
import ModelTraining from './pages/ModelTraining';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard / Overview */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Overview />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Question Paper Generation (Tamil Nadu State Board Classes 6-12) */}
        <Route
          path="/generate-paper"
          element={
            <ProtectedRoute>
              <Layout>
                <GeneratePaper />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Paper Preview & Print/Download */}
        <Route
          path="/preview"
          element={
            <ProtectedRoute>
              <Layout>
                <PaperPreview />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Question Bank (TN State Board) */}
        <Route
          path="/question-bank"
          element={
            <ProtectedRoute>
              <Layout>
                <QuestionBank />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Paper Generation History (Role-Scoped) */}
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <Layout>
                <HistoryPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Settings & Profile */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ======================================================= */}
        {/* ADMIN-ONLY PROTECTED ROUTES (TEACHERS BLOCKED WITH 403) */}
        {/* ======================================================= */}
        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <AdminStaff />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/datasets"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <DatasetManagement />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/models"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <ModelTraining />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Backward Compatibility & Fallback Redirects */}
        <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
        <Route path="/model-performance" element={<Navigate to="/admin/models" replace />} />
        <Route path="/performance" element={<Navigate to="/admin/models" replace />} />
        <Route path="/classification" element={<Navigate to="/question-bank" replace />} />
        <Route path="/classify" element={<Navigate to="/question-bank" replace />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/generate" element={<Navigate to="/generate-paper" replace />} />
        <Route path="/questions" element={<Navigate to="/question-bank" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
