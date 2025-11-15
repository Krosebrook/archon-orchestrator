import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EmptyState({ icon: Icon, title, description, actionText, onAction }) {
  return (
    <Card className="bg-slate-900 border-2 border-dashed border-slate-800">
      <CardContent className="p-12 text-center">
        {Icon && <Icon className="w-12 h-12 text-slate-600 mx-auto mb-4" />}
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400 mb-6 max-w-sm mx-auto">{description}</p>
        {onAction && actionText && (
          <Button onClick={onAction} className="bg-blue-600 hover:bg-blue-700">
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}