import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Skill, SkillReview, SkillInstallation, Agent } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Star, Download, Shield, DollarSign, Code, Lock, AlertTriangle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import SkillInstaller from '../components/skills/SkillInstaller';
import SkillReviews from '../components/skills/SkillReviews';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function SkillDetail() {
  const [searchParams] = useSearchParams();
  const skillId = searchParams.get('id');
  
  const [skill, setSkill] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [installerOpen, setInstallerOpen] = useState(false);

  useEffect(() => {
    if (skillId) loadData();
  }, [skillId]);

  const loadData = async () => {
    try {
      const [skillData, reviewData, installData, agentData] = await Promise.all([
        Skill.get(skillId),
        SkillReview.filter({ skill_id: skillId }),
        SkillInstallation.filter({ skill_id: skillId }),
        Agent.list()
      ]);
      setSkill(skillData);
      setReviews(reviewData);
      setInstallations(installData);
      setAgents(agentData);
    } catch (error) {
      console.error('Failed to load skill:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-slate-400">Loading skill...</div>;
  }

  if (!skill) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">Skill not found</p>
        <Link to={createPageUrl('SkillMarketplace')}>
          <Button>Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const avgRating = skill.avg_rating || 0;
  const isInstalled = installations.length > 0;

  return (
    <div className="space-y-6">
      <Link to={createPageUrl('SkillMarketplace')} className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-start gap-4">
                {skill.icon_url ? (
                  <img src={skill.icon_url} alt={skill.name} className="w-16 h-16 rounded-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-2xl">
                    {skill.name[0]}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-white">{skill.name}</h1>
                    {skill.is_verified && (
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-400 mb-3">{skill.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500">by {skill.author_name || skill.author_email}</span>
                    <span className="text-slate-700">•</span>
                    <Badge variant="outline" className="bg-slate-800 text-slate-400">v{skill.version}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="specification">Specification</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">About this Skill</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-300">{skill.description}</p>
                  
                  {skill.tags && skill.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {skill.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="bg-slate-800 text-slate-400">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                    <div>
                      <div className="text-sm text-slate-500">Category</div>
                      <div className="text-white capitalize">{skill.category.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Installations</div>
                      <div className="text-white">{skill.install_count || 0}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specification" className="mt-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Technical Specification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Type</h3>
                    <Badge variant="outline" className="bg-slate-800 text-slate-300">
                      {skill.spec.type}
                    </Badge>
                  </div>

                  {skill.spec.parameters && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-2">Parameters</h3>
                      <SyntaxHighlighter language="json" style={vscDarkPlus} className="rounded-lg">
                        {JSON.stringify(skill.spec.parameters, null, 2)}
                      </SyntaxHighlighter>
                    </div>
                  )}

                  {skill.spec.permissions && skill.spec.permissions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-2">Required Permissions</h3>
                      <div className="space-y-2">
                        {skill.spec.permissions.map((perm, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                            <Lock className="w-4 h-4 text-yellow-400" />
                            {perm}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    Sandbox Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-blue-400 mb-1">Secure Execution</div>
                      <div className="text-sm text-slate-400">
                        This skill runs in a sandboxed environment with restricted access to system resources.
                      </div>
                    </div>
                  </div>

                  {skill.sandbox_config && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-500">Timeout</div>
                        <div className="text-white">{skill.sandbox_config.timeout_ms || 5000}ms</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Max Memory</div>
                        <div className="text-white">{skill.sandbox_config.max_memory_mb || 128}MB</div>
                      </div>
                    </div>
                  )}

                  {skill.sandbox_config?.allowed_apis && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-2">Allowed APIs</h3>
                      <div className="space-y-1">
                        {skill.sandbox_config.allowed_apis.map((api, idx) => (
                          <div key={idx} className="text-sm text-slate-300 font-mono">
                            {api}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <SkillReviews skillId={skillId} reviews={reviews} onRefresh={loadData} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-2xl font-bold text-white">{avgRating.toFixed(1)}</span>
                </div>
                <span className="text-slate-400">{reviews.length} reviews</span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <Download className="w-5 h-5" />
                <span>{skill.install_count || 0} installations</span>
              </div>

              {skill.pricing && skill.pricing.model !== 'free' ? (
                <div className="p-4 bg-slate-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span className="text-lg font-bold text-white">
                      ${(skill.pricing.amount_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 capitalize">{skill.pricing.model.replace('_', ' ')}</p>
                </div>
              ) : (
                <Badge className="w-full justify-center py-2 bg-green-500/20 text-green-400 border-green-500/30">
                  Free
                </Badge>
              )}

              <Button
                onClick={() => setInstallerOpen(true)}
                disabled={isInstalled}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isInstalled ? 'Already Installed' : 'Install Skill'}
              </Button>

              {isInstalled && (
                <p className="text-xs text-center text-slate-500">
                  Installed on {installations.length} agent{installations.length !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">Developer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                  <span className="text-sm">{(skill.author_name || skill.author_email)[0].toUpperCase()}</span>
                </div>
                <div>
                  <div className="text-white font-medium">{skill.author_name || 'Anonymous'}</div>
                  <div className="text-xs text-slate-500">{skill.author_email}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SkillInstaller
        skill={skill}
        agents={agents}
        open={installerOpen}
        onOpenChange={setInstallerOpen}
        onInstall={loadData}
      />
    </div>
  );
}