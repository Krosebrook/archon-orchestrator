import TemplateCard from './TemplateCard';

export default function TemplateLibrary({ templates, onRefresh, getTemplateRating }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map(template => {
        const rating = getTemplateRating?.(template.id) || { average: 0, count: 0 };
        return (
          <TemplateCard 
            key={template.id} 
            template={template} 
            onRefresh={onRefresh}
            averageRating={rating.average}
            reviewCount={rating.count}
          />
        );
      })}
    </div>
  );
}