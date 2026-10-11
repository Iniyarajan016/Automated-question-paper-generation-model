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
import Classification from './pages/Classification';
import Performance from './pages/Performance';
import HistoryPage from './pages/History';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
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
        <Route
          path="/classification"
          element={
            <ProtectedRoute>
              <Layout>
                <Classification />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/model-performance"
          element={
            <ProtectedRoute>
              <Layout>
                <Performance />
              </Layout>
            </ProtectedRoute>
          }
        />
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

        {/* Backward Compatibility & Fallback Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/generate" element={<Navigate to="/generate-paper" replace />} />
        <Route path="/questions" element={<Navigate to="/question-bank" replace />} />
        <Route path="/classify" element={<Navigate to="/classification" replace />} />
        <Route path="/performance" element={<Navigate to="/model-performance" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
