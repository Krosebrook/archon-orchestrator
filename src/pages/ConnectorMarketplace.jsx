import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Plug,
  Search,
  Plus,
  CheckCircle2,
  Star,
  Loader2,
  Settings,
  Code,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ConnectorCard from '../components/connectors/ConnectorCard';
import InstallConnectorDialog from '../components/connectors/InstallConnectorDialog';
import MyConnectors from '../components/connectors/MyConnectors';

export default function ConnectorMarketplace() {
  const navigate = useNavigate();
  const [connectors, setConnectors] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConnector, setSelectedConnector] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [connectorData, installationData] = await Promise.all([
        base44.entities.ConnectorDefinition.filter({ is_marketplace: true }),
        base44.entities.ConnectorInstallation.list('-created_date'),
      ]);
      
      setConnectors(connectorData);
      setInstallations(installationData);
    } catch (error) {
      console.error('Failed to load connectors:', error);
      toast.error('Failed to load connectors');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConnectors = connectors.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'crm', 'communication', 'project_management', 'analytics', 'storage'];

  const installedCount = installations.filter(i => i.status === 'active').length;
  const officialCount = connectors.filter(c => c.is_official).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Plug className="w-8 h-8 text-blue-400" />
            Connector Marketplace
          </h1>
          <p className="text-slate-400 mt-2">
            Connect Archon with your favorite tools and services
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('ConnectorSubmission'))}
          >
            <Plus className="w-4 h-4 mr-2" />
            Submit Connector
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => navigate(createPageUrl('ConnectorBuilder'))}
          >
            <Code className="w-4 h-4 mr-2" />
            Build Custom Connector
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Available Connectors</p>
                <p className="text-2xl font-bold text-white mt-1">{connectors.length}</p>
              </div>
              <Plug className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Installed</p>
                <p className="text-2xl font-bold text-white mt-1">{installedCount}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Official Connectors</p>
                <p className="text-2xl font-bold text-white mt-1">{officialCount}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="marketplace" className="space-y-4">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="marketplace">
            <Plug className="w-4 h-4 mr-2" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="installed">
            <Settings className="w-4 h-4 mr-2" />
            My Connectors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search connectors..."
                className="pl-10 bg-slate-900 border-slate-700"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={selectedCategory === cat ? 'bg-blue-600' : ''}
                >
                  {cat === 'all' ? 'All' : cat.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Connector Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConnectors.map((connector) => (
              <ConnectorCard
                key={connector.id}
                connector={connector}
                isInstalled={installations.some(i => i.connector_id === connector.id && i.status === 'active')}
                onInstall={() => setSelectedConnector(connector)}
                onRefresh={loadData}
              />
            ))}
          </div>

          {filteredConnectors.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Plug className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No connectors found matching your criteria</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="installed">
          <MyConnectors installations={installations} connectors={connectors} onRefresh={loadData} />
        </TabsContent>
      </Tabs>

      {/* Install Dialog */}
      {selectedConnector && (
        <InstallConnectorDialog
          connector={selectedConnector}
          open={!!selectedConnector}
          onClose={() => setSelectedConnector(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}