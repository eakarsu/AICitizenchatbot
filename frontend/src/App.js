import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import FeaturePage from './components/FeaturePage';
import Chatbot from './components/Chatbot';
import ServiceFinder from './components/ServiceFinder';
import ComplaintClassifier from './components/ComplaintClassifier';
import AppointmentHelper from './components/AppointmentHelper';
import PermitGuide from './components/PermitGuide';
import AdminAnalytics from './components/AdminAnalytics';
import FeedbackForm from './components/FeedbackForm';
import ResourceNavigator from './components/ResourceNavigator';
import MultiLanguage from './components/MultiLanguage';
import AccessibilityParaphrase from './components/AccessibilityParaphrase';
import Notifications from './components/Notifications';
import Exports from './components/Exports';
import PermitEligibility from './components/PermitEligibility';
import CategorizeFeedback from './components/CategorizeFeedback';
import CustomViewsPage from './components/CustomViewsPage';
import ServiceSlaEscalation from './components/ServiceSlaEscalation';
import features from './config/features';
import './App.css';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          {features.map((feature) => (
            <Route
              key={feature.key}
              path={feature.key}
              element={<FeaturePage feature={feature} />}
            />
          ))}
          <Route path="chatbot" element={<Chatbot />} />
          <Route path="service-finder" element={<ServiceFinder />} />
          <Route path="complaint-classifier" element={<ComplaintClassifier />} />
          <Route path="appointment-helper" element={<AppointmentHelper />} />
          <Route path="permit-guide" element={<PermitGuide />} />
          <Route path="resource-navigator" element={<ResourceNavigator />} />
          <Route path="multi-language" element={<MultiLanguage />} />
          <Route path="accessibility" element={<AccessibilityParaphrase />} />
          <Route path="feedback" element={<FeedbackForm />} />
          <Route path="admin-analytics" element={<AdminAnalytics />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="exports" element={<Exports />} />
          <Route path="permit-eligibility" element={<PermitEligibility />} />
          <Route path="categorize-feedback" element={<CategorizeFeedback />} />
          <Route path="custom-views" element={<CustomViewsPage />} />
          <Route path="service-sla-escalation" element={<ServiceSlaEscalation />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
