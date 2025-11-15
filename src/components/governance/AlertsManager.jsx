import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert as AlertEntity } from '@/entities/all';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Bell, Trash2 } from 'lucide-react';

export default function AlertsManager() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await AlertEntity.list();
      setAlerts(data);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAlert = async (alertId, enabled) => {
    try {
      await AlertEntity.update(alertId, { enabled });
      loadAlerts();
    } catch (error) {
      console.error("Failed to toggle alert:", error);
    }
  };
  
  const deleteAlert = async (alertId) => {
    if (confirm('Are you sure you want to delete this alert?')) {
        try {
            await AlertEntity.delete(alertId);
            loadAlerts();
        } catch(error) {
            console.error("Failed to delete alert:", error);
        }
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-white" />
            <CardTitle className="text-white">Alerts</CardTitle>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> New Alert
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="border-b-slate-700 hover:bg-slate-900">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">Condition</TableHead>
                <TableHead className="text-slate-400">Enabled</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id} className="border-b-slate-700">
                  <TableCell className="font-medium text-white">{alert.name}</TableCell>
                  <TableCell className="text-slate-300 capitalize">{alert.type.replace('_', ' ')}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-400">
                    {`> $${alert.condition.threshold}`}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={alert.enabled}
                      onCheckedChange={(checked) => toggleAlert(alert.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteAlert(alert.id)} className="text-red-500 hover:text-red-400">
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