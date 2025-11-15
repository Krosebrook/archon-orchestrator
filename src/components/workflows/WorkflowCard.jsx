import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitFork, ArrowRight, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function WorkflowCard({ workflow }) {
  return (
    <Card className="bg-slate-900 border-slate-800 flex flex-col hover:border-blue-600/50 transition-colors duration-300">
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
            <GitFork className="w-6 h-6 text-blue-400" />
        </div>
        <div>
            <CardTitle className="text-white text-lg">{workflow.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
                <Tag className="w-3 h-3 text-slate-500"/>
                <span className="text-xs font-mono text-slate-400">v{workflow.version}</span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-slate-400 text-sm line-clamp-2">
            {workflow.description || 'No description provided.'}
        </p>
      </CardContent>
      <CardFooter className="bg-slate-900/50 border-t border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-slate-500">
            Updated {format(new Date(workflow.updated_date), 'MMM d, yyyy')}
        </div>
        <Link to={createPageUrl(`WorkflowDetail?id=${workflow.id}`)}>
            <Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white">
                Open Editor <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}