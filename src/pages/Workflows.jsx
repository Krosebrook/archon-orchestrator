import { useState, useEffect } from 'react';
import { Workflow } from '@/entities/Workflow';
import { Button } from '@/components/ui/button';
import { PlusCircle, Library, Search, GitFork } from 'lucide-react';
import { handleError } from '../components/utils/api-client';
import { useRBAC } from '../components/hooks/useRBAC';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import WorkflowCard from '../components/workflows/WorkflowCard';
import TemplateLibrary from '../components/templates/TemplateLibrary';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '../components/shared/EmptyState';
import { Input } from '@/components/ui/input';

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { hasPermission } = useRBAC();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setIsLoading(true);
    try {
      const data = await Workflow.list('-updated_date');
      setWorkflows(data);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (newWorkflow) => {
    setShowTemplateLibrary(false);
    navigate(createPageUrl(`WorkflowDetail?id=${newWorkflow.id}`));
  };

  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showTemplateLibrary) {
    return <TemplateLibrary onTemplateSelect={handleTemplateSelect} onClose={() => setShowTemplateLibrary(false)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Workflows</h1>
          <p className="text-slate-400">Design, manage, and version your automated processes.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowTemplateLibrary(true)}
            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
          >
            <Library className="mr-2 h-4 w-4" />
            Browse Templates
          </Button>
          {hasPermission('workflow.create') && (
            <Link to={createPageUrl('WorkflowDetail')}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Workflow
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search workflows..."
            className="bg-slate-800 border-slate-700 pl-9 w-full md:w-1/3"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
             <Skeleton key={i} className="h-56 w-full bg-slate-800 rounded-lg" />
          ))}
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <EmptyState 
          icon={<GitFork className="w-12 h-12" />}
          title="No Workflows Found"
          description="Get started by creating a new workflow from scratch or by using one of our pre-built templates."
          action={{ label: 'Browse Templates', onClick: () => setShowTemplateLibrary(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map(workflow => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>
      )}
    </div>
  );
}