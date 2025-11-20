import React, { useState, useEffect } from 'react';
import { Skill, SkillReview } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star, TrendingUp, Clock, Shield, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SkillCard from '../components/skills/SkillCard';
import PublishSkillDialog from '../components/skills/PublishSkillDialog';

export default function SkillMarketplace() {
  const [skills, setSkills] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [isLoading, setIsLoading] = useState(true);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [skillData, reviewData] = await Promise.all([
        Skill.filter({ is_public: true }),
        SkillReview.list()
      ]);
      setSkills(skillData);
      setReviews(reviewData);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'All Skills' },
    { value: 'tool', label: 'Tools' },
    { value: 'integration', label: 'Integrations' },
    { value: 'llm_capability', label: 'LLM Capabilities' },
    { value: 'data_processor', label: 'Data Processors' },
    { value: 'api_connector', label: 'API Connectors' },
    { value: 'custom', label: 'Custom' }
  ];

  const filteredSkills = skills
    .filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = category === 'all' || skill.category === category;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return (b.install_count || 0) - (a.install_count || 0);
      if (sortBy === 'rating') return (b.avg_rating || 0) - (a.avg_rating || 0);
      if (sortBy === 'recent') return new Date(b.created_date) - new Date(a.created_date);
      return 0;
    });

  const featuredSkills = skills
    .filter(s => s.is_verified || (s.install_count || 0) > 100)
    .slice(0, 6);

  const trendingSkills = skills
    .sort((a, b) => {
      const aGrowth = (a.install_count || 0) / Math.max((new Date() - new Date(a.created_date)) / 86400000, 1);
      const bGrowth = (b.install_count || 0) / Math.max((new Date() - new Date(b.created_date)) / 86400000, 1);
      return bGrowth - aGrowth;
    })
    .slice(0, 6);

  const newSkills = skills
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 6);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-slate-400">
        Loading marketplace...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Skill Marketplace</h1>
          <p className="text-slate-400">Discover and integrate new capabilities for your agents</p>
        </div>
        <Button onClick={() => setPublishDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Publish Skill
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search skills, tags, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-700 text-white"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-900 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-900 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="browse">Browse All</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          {filteredSkills.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-12 text-center">
                <p className="text-slate-400">No skills found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSkills.map(skill => (
                <SkillCard key={skill.id} skill={skill} reviews={reviews} onRefresh={loadData} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <Shield className="w-4 h-4 text-blue-400" />
            Platform verified and highly rated skills
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSkills.map(skill => (
              <SkillCard key={skill.id} skill={skill} reviews={reviews} onRefresh={loadData} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <TrendingUp className="w-4 h-4 text-green-400" />
            Fast-growing skills in the past 30 days
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingSkills.map(skill => (
              <SkillCard key={skill.id} skill={skill} reviews={reviews} onRefresh={loadData} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4 text-purple-400" />
            Recently published skills
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newSkills.map(skill => (
              <SkillCard key={skill.id} skill={skill} reviews={reviews} onRefresh={loadData} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <PublishSkillDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        onPublish={loadData}
      />
    </div>
  );
}