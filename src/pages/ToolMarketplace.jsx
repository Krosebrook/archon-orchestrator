import React, { useState, useEffect } from 'react';
import { ToolIntegration } from '@/entities/all';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Store, Package } from 'lucide-react';
import IntegrationGrid from '../components/marketplace/IntegrationGrid';
import InstalledIntegrations from '../components/marketplace/InstalledIntegrations';
import { toast } from 'sonner';

export default function ToolMarketplace() {
  const [integrations, setIntegrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const data = await ToolIntegration.list('-installation_count');
      setIntegrations(data);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'storage', label: 'Storage' },
    { value: 'database', label: 'Database' },
    { value: 'communication', label: 'Communication' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'crm', label: 'CRM' },
    { value: 'payment', label: 'Payment' },
    { value: 'ai', label: 'AI' },
    { value: 'productivity', label: 'Productivity' }
  ];

  const filteredIntegrations = integrations.filter(i => {
    const matchesSearch = !searchQuery || 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || i.category === selectedCategory;
    
    return matchesSearch && matchesCategory && i.is_marketplace_item;
  });

  const installedIntegrations = integrations.filter(i => i.is_installed);
  const marketplaceIntegrations = filteredIntegrations;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Store className="w-8 h-8 text-blue-400" />
          Tool Marketplace
        </h1>
        <p className="text-slate-400">Discover and install integrations to expand your workflows</p>
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800">
          <TabsTrigger value="marketplace">
            <Store className="w-4 h-4 mr-2" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="installed">
            <Package className="w-4 h-4 mr-2" />
            Installed ({installedIntegrations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="mt-6">
          <IntegrationGrid integrations={marketplaceIntegrations} onRefresh={loadIntegrations} />
        </TabsContent>

        <TabsContent value="installed" className="mt-6">
          <InstalledIntegrations integrations={installedIntegrations} onRefresh={loadIntegrations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}