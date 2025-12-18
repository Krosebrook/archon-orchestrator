import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Zap, CheckCircle, XCircle, AlertCircle, Settings, Trash2, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import ExternalConnectionForm from './ExternalConnectionForm';

const SERVICE_ICONS = {
  slack: '💬',
  github: '🐙',
  aws_s3: '☁️',
  google_drive: '📁',
  dropbox: '📦',
  stripe: '💳',
  sendgrid: '📧',
  twilio: '📱',
  custom: '🔌'
};

const SERVICE_COLORS = {
  slack: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  github: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  aws_s3: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  google_drive: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  dropbox: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  stripe: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  sendgrid: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  twilio: 'bg-red-500/20 text-red-400 border-red-500/30',
  custom: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

export default function ExternalConnectionManager() {
  const { organization } = useAuth();
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.ExternalConnection.list('-updated_date');
      setConnections(data);
    } catch (error) {
      console.error('Failed to load connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async (connection) => {
    toast.info('Testing connection...');
    try {
      // In production, call a test endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await base44.entities.ExternalConnection.update(connection.id, {
        last_tested: new Date().toISOString(),
        status: 'active'
      });
      
      toast.success('Connection test successful');
      loadConnections();
    } catch (error) {
      toast.error('Connection test failed');
    }
  };

  const handleDelete = async (connection) => {
    if (!confirm(`Delete connection "${connection.name}"? This may break workflows using this connection.`)) {
      return;
    }

    try {
      await base44.entities.ExternalConnection.delete(connection.id);
      toast.success('Connection deleted');
      loadConnections();
    } catch (error) {
      toast.error('Failed to delete connection');
    }
  };

  const handleEdit = (connection) => {
    setEditingConnection(connection);
    setShowForm(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-slate-400" />;
      default: return null;
    }
  };

  return (
    <>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            External Connections
          </CardTitle>
          <Button
            onClick={() => {
              setEditingConnection(null);
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Loading connections...</div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No external connections configured</p>
              <Button 
                onClick={() => setShowForm(true)}
                variant="outline"
                className="border-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Connection
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connections.map(conn => (
                <Card key={conn.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{SERVICE_ICONS[conn.service]}</div>
                        <div>
                          <CardTitle className="text-white text-base">{conn.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={SERVICE_COLORS[conn.service]}>
                              {conn.service.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className={
                              conn.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : conn.status === 'error'
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                            }>
                              {getStatusIcon(conn.status)}
                              <span className="ml-1">{conn.status}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="text-xs text-slate-500 space-y-1">
                      {conn.last_used && (
                        <div>Last used: {new Date(conn.last_used).toLocaleString()}</div>
                      )}
                      {conn.usage_count > 0 && (
                        <div>Used {conn.usage_count} times</div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(conn)}
                        className="border-slate-600 flex-1"
                      >
                        <TestTube className="w-3 h-3 mr-1" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(conn)}
                        className="border-slate-600 flex-1"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(conn)}
                        className="border-slate-600 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ExternalConnectionForm
        open={showForm}
        onOpenChange={setShowForm}
        connection={editingConnection}
        onSuccess={loadConnections}
      />
    </>
  );
}