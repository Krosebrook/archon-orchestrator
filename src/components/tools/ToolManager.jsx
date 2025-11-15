import { useState, useEffect } from 'react';
import { Tool } from '@/entities/Tool';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Wrench } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export default function ToolManager() {
  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTools = async () => {
      setIsLoading(true);
      try {
        const data = await Tool.list();
        setTools(data);
      } catch (error) {
        console.error("Failed to load tools:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTools();
  }, []);
  
  const toggleTool = async (toolId, enabled) => {
    try {
        await Tool.update(toolId, { enabled });
        setTools(tools.map(t => t.id === toolId ? {...t, enabled} : t));
    } catch (error) {
        console.error("Failed to toggle tool:", error);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2"><Wrench className="w-5 h-5"/> Manage Agent Tools</CardTitle>
        <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Add Tool</Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="border-b-slate-700 hover:bg-slate-900">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">Description</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map(tool => (
                <TableRow key={tool.id} className="border-b-slate-700">
                  <TableCell className="font-medium text-white">{tool.name}</TableCell>
                  <TableCell><Badge variant="outline">{tool.type}</Badge></TableCell>
                  <TableCell className="text-slate-400">{tool.description}</TableCell>
                  <TableCell>
                     <Switch checked={tool.enabled} onCheckedChange={(checked) => toggleTool(tool.id, checked)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}