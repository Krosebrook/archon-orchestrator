import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/**
 * Empty state component with optional CTA.
 * 
 * @example
 * <EmptyState
 *   icon={<Bot className="w-12 h-12" />}
 *   title="No agents yet"
 *   description="Get started by creating your first AI agent"
 *   action={{ label: 'Create Agent', onClick: handleCreate }}
 * />
 */
export function EmptyState({ 
  icon, 
  title = 'No items yet',
  description = 'Get started by creating your first item',
  action,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      {icon && (
        <div className="text-slate-600 mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-white mb-2">
        {title}
      </h3>
      
      <p className="text-slate-400 mb-6 max-w-md">
        {description}
      </p>
      
      {action && (
        <Button onClick={action.onClick} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  );
}