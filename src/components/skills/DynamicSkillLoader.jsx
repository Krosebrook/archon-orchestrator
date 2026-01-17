import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DynamicSkillLoader({ agent, onSkillLoaded }) {
  const [loading, setLoading] = useState(false);
  const [loadedSkills, setLoadedSkills] = useState([]);

  const loadSkillsForAgent = async () => {
    setLoading(true);
    try {
      const installations = await base44.entities.SkillInstallation.filter({ 
        agent_id: agent.id,
        status: 'active'
      });

      const skills = await Promise.all(
        installations.map(inst => base44.entities.Skill.filter({ id: inst.skill_id }))
      );

      const flatSkills = skills.flat();
      setLoadedSkills(flatSkills);
      
      // Track usage
      const user = await base44.auth.me();
      await Promise.all(flatSkills.map(skill => 
        base44.entities.SkillUsage.create({
          skill_id: skill.id,
          agent_id: agent.id,
          execution_count: 0,
          last_used: new Date().toISOString(),
          org_id: user.organization.id
        }).catch(() => {}) // Ignore if already exists
      ));

      toast.success(`Loaded ${flatSkills.length} skills`);
      onSkillLoaded?.(flatSkills);
    } catch (error) {
      console.error('Failed to load skills:', error);
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Dynamic Skill Loader</CardTitle>
          <Button
            onClick={loadSkillsForAgent}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Load Skills
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loadedSkills.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No skills loaded yet. Click "Load Skills" to dynamically load agent capabilities.
          </p>
        ) : (
          <div className="space-y-2">
            {loadedSkills.map(skill => (
              <div key={skill.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{skill.name}</p>
                  <p className="text-xs text-slate-400">{skill.category}</p>
                </div>
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Loaded
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}