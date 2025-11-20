import React, { useState, useEffect } from 'react';
import { ToolIntegration } from '@/entities/all';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Settings, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import IntegrationsList from '../components/integrations/IntegrationsList';
import { toast } from 'sonner';

export default function IntegrationManagement() {
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const data = await ToolIntegration.list();
      setIntegrations(data.filter(i => i.is_installed));
    } catch (error) {
      console.error('Failed to load integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredIntegrations = integrations.filter(i => {
    const matchesSearch = !searchQuery || 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.provider.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: integrations.length,
    active: integrations.filter(i => i.status === 'active').length,
    inactive: integrations.filter(i => i.status === 'inactive').length,
    error: integrations.filter(i => i.status === 'error').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading integrations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Settings className="w-8 h-8 text-blue-400" />
            Integration Management
          </h1>
          <p className="text-slate-400">Manage and configure your installed integrations</p>
        </div>
        <Button 
          onClick={() => navigate(createPageUrl('ToolMarketplace'))}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{statusCounts.all}</div>
            <div className="text-sm text-slate-400">Total Installed</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">{statusCounts.active}</div>
            <div className="text-sm text-slate-400">Active</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-400">{statusCounts.inactive}</div>
            <div className="text-sm text-slate-400">Inactive</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">{statusCounts.error}</div>
            <div className="text-sm text-slate-400">Errors</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search integrations..."
                className="pl-9 bg-slate-950 border-slate-700 text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="error">Error</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {filteredIntegrations.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12 text-center">
            <p className="text-slate-400 mb-4">No installed integrations found</p>
            <Button onClick={() => navigate(createPageUrl('ToolMarketplace'))}>
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <IntegrationsList integrations={filteredIntegrations} onRefresh={loadIntegrations} />
      )}
    </div>
  );
}