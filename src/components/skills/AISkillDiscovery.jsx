import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Download, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AISkillDiscovery({ workflow, agent, installedSkills }) {
  const [recommendations, setRecommendations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [installing, setInstalling] = useState(null);

  const analyzeWorkflow = async () => {
    setIsAnalyzing(true);
    try {
      const workflowContext = {
        workflow_spec: workflow?.spec || {},
        agent_capabilities: agent?.config || {},
        installed_skills: installedSkills.map(s => s.name),
        workflow_type: workflow?.category || 'general'
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this workflow and recommend relevant skills:
${JSON.stringify(workflowContext, null, 2)}

Recommend 5-10 skills that would enhance this workflow. For each skill:
1. Name and category
2. Why it's relevant (specific use case)
3. Expected impact (performance/reliability/cost)
4. Priority (high/medium/low)

Focus on practical, high-impact skills that fill capability gaps.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  description: { type: "string" },
                  relevance: { type: "string" },
                  impact: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] }
                }
              }
            }
          }
        }
      });

      setRecommendations(result.recommendations || []);
      toast.success('Skill recommendations generated');
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      toast.error('Failed to analyze workflow');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const installSkill = async (skillName) => {
    setInstalling(skillName);
    try {
      const user = await base44.auth.me();
      
      // Check if skill exists, if not create it
      const existingSkills = await base44.entities.Skill.filter({ name: skillName });
      let skill = existingSkills[0];
      
      if (!skill) {
        skill = await base44.entities.Skill.create({
          name: skillName,
          description: `AI-recommended skill for ${workflow?.name || 'workflow'}`,
          category: 'custom',
          author_email: user.email,
          author_name: user.fullName,
          version: '1.0.0',
          spec: { type: 'function', code: '' },
          is_public: false,
          org_id: user.organization.id
        });
      }

      await base44.entities.SkillInstallation.create({
        skill_id: skill.id,
        agent_id: agent.id,
        installed_by: user.email,
        status: 'active',
        org_id: user.organization.id
      });

      toast.success(`${skillName} installed`);
    } catch (error) {
      toast.error('Installation failed');
    } finally {
      setInstalling(null);
    }
  };

  const priorityColors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Skill Discovery
          </CardTitle>
          <Button
            onClick={analyzeWorkflow}
            disabled={isAnalyzing || !workflow}
            className="bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Discover Skills
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!recommendations.length && !isAnalyzing && (
          <p className="text-slate-400 text-sm text-center py-8">
            Click "Discover Skills" to get AI-powered skill recommendations
          </p>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold">{rec.name}</h4>
                      <Badge variant="outline" className={priorityColors[rec.priority]}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">{rec.category}</p>
                  </div>
                  <Button
                    onClick={() => installSkill(rec.name)}
                    disabled={installing === rec.name}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {installing === rec.name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1" />
                        Install
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-slate-300 mb-2">{rec.description}</p>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">
                    <span className="text-purple-400">Relevance:</span> {rec.relevance}
                  </p>
                  <p className="text-xs text-green-400">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {rec.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}