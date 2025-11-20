import React from 'react';
import TemplateCard from './TemplateCard';

export default function TemplateLibrary({ templates, onRefresh }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map(template => (
        <TemplateCard 
          key={template.id} 
          template={template} 
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}