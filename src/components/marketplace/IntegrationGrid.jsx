import React from 'react';
import IntegrationCard from './IntegrationCard';

export default function IntegrationGrid({ integrations, onRefresh }) {
  if (integrations.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        No integrations found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {integrations.map(integration => (
        <IntegrationCard 
          key={integration.id} 
          integration={integration} 
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}