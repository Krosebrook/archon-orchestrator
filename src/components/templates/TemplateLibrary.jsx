import { useState, useEffect } from 'react';
import { WorkflowTemplate } from '@/entities/WorkflowTemplate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookCopy, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function TemplateLibrary() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        const data = await WorkflowTemplate.list();
        setTemplates(data);
      } catch (error) {
        console.error("Failed to load templates:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplates();
  }, []);

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border-slate-700 pl-9"
            />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="bg-slate-900 border-slate-800 flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                  <CardDescription className="text-slate-400 capitalize">{template.category.replace('_', ' ')}</CardDescription>
                </div>
                {template.is_official && <Badge className="bg-blue-500/20 text-blue-400">Official</Badge>}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-slate-300 text-sm mb-4">{template.description}</p>
              <div className="flex flex-wrap gap-2">
                {template.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            </CardContent>
            <div className="p-4 pt-0">
              <Button className="w-full"><BookCopy className="w-4 h-4 mr-2" /> Use Template</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}