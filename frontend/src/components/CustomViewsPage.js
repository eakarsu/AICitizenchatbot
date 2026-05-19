import React from 'react';
import TopicHeatmap from './TopicHeatmap';
import ResolutionFunnel from './ResolutionFunnel';
import FaqPdfExport from './FaqPdfExport';
import IntentTrainingEditor from './IntentTrainingEditor';

function CustomViewsPage() {
  return (
    <div className="page" style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, color: '#111827' }}>Citizen Views</h1>
        <p style={{ color: '#6b7280', marginTop: 6 }}>
          Custom operations dashboards and tooling for the citizen-services chatbot.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <TopicHeatmap />
        <ResolutionFunnel />
        <FaqPdfExport />
        <IntentTrainingEditor />
      </div>
    </div>
  );
}

export default CustomViewsPage;
