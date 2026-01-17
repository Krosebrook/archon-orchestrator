import { useState, useEffect } from 'react';
import { Secret } from '@/entities/Secret';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SecretManager() {
  const [secrets, setSecrets] = useState([]);
  const [_isLoading, _setIsLoading] = useState(true);
  const [revealedSecrets, setRevealedSecrets] = useState({});

  useEffect(() => {
    loadSecrets();
  }, []);

  const loadSecrets = async () => {
    setIsLoading(true);
    try {
      const data = await Secret.list();
      setSecrets(data);
    } catch (error) {
      console.error("Failed to load secrets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReveal = (id) => {
    setRevealedSecrets(prev => ({...prev, [id]: !prev[id]}));
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2"><Key className="w-5 h-5" /> Secret Management</CardTitle>
        <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Add Secret</Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="border-b-slate-700 hover:bg-slate-900">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Value</TableHead>
                <TableHead className="text-slate-400">Last Updated</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secrets.map(secret => (
                <TableRow key={secret.id} className="border-b-slate-700">
                  <TableCell className="font-mono text-white">{secret.name}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-400">
                    {revealedSecrets[secret.id] ? secret.value : '••••••••••••••••••••'}
                  </TableCell>
                  <TableCell className="text-slate-400">{secret.updated_date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => toggleReveal(secret.id)} className="mr-2">
                        {revealedSecrets[secret.id] ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4"/>
                    </Button>
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