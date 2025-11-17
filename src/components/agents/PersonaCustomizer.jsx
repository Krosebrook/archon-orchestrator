import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Save, Loader2, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TONE_PRESETS = {
  professional: { label: 'Professional', description: 'Formal, precise, business-oriented' },
  friendly: { label: 'Friendly', description: 'Warm, approachable, conversational' },
  technical: { label: 'Technical', description: 'Detailed, precise, developer-focused' },
  creative: { label: 'Creative', description: 'Innovative, exploratory, unconventional' },
  analytical: { label: 'Analytical', description: 'Data-driven, logical, systematic' }
};

export default function PersonaCustomizer({ agent, onUpdate }) {
  const [persona, setPersona] = useState({
    tone: agent.config?.persona?.tone || 'professional',
    communication_style: agent.config?.persona?.communication_style || '',
    expertise_areas: agent.config?.persona?.expertise_areas || [],
    constraints: agent.config?.persona?.constraints || '',
    temperature: agent.config?.temperature || 0.7,
    system_prompt: agent.config?.persona?.system_prompt || ''
  });
  const [newExpertise, setNewExpertise] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addExpertise = () => {
    if (newExpertise.trim() && !persona.expertise_areas.includes(newExpertise.trim())) {
      setPersona({ ...persona, expertise_areas: [...persona.expertise_areas, newExpertise.trim()] });
      setNewExpertise('');
    }
  };

  const removeExpertise = (item) => {
    setPersona({ ...persona, expertise_areas: persona.expertise_areas.filter(e => e !== item) });
  };

  const savePersona = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Agent.update(agent.id, {
        config: {
          ...agent.config,
          persona,
          temperature: persona.temperature
        }
      });

      toast.success('Persona updated successfully');
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update persona:', error);
      toast.error('Failed to update persona');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <UserCircle className="w-5 h-5" />
          Persona Customization
        </CardTitle>
        <p className="text-sm text-slate-400">
          Define how this agent communicates and behaves
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Communication Tone</Label>
          <Select value={persona.tone} onValueChange={(value) => setPersona({ ...persona, tone: value })}>
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {Object.entries(TONE_PRESETS).map(([key, { label, description }]) => (
                <SelectItem key={key} value={key} className="text-slate-300">
                  <div>
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-slate-400">{description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Temperature ({persona.temperature})</Label>
          <Slider
            value={[persona.temperature]}
            onValueChange={([value]) => setPersona({ ...persona, temperature: value })}
            min={0}
            max={1}
            step={0.1}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Focused</span>
            <span>Creative</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Communication Style</Label>
          <Textarea
            value={persona.communication_style}
            onChange={(e) => setPersona({ ...persona, communication_style: e.target.value })}
            placeholder="e.g., Use bullet points, avoid jargon, provide examples..."
            className="bg-slate-800 border-slate-700 resize-none"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Expertise Areas</Label>
          <div className="flex gap-2">
            <Input
              value={newExpertise}
              onChange={(e) => setNewExpertise(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addExpertise()}
              placeholder="e.g., Data analysis, Python, API design"
              className="bg-slate-800 border-slate-700"
            />
            <Button onClick={addExpertise} size="icon" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {persona.expertise_areas.map((item, idx) => (
              <Badge key={idx} variant="outline" className="bg-slate-800 border-slate-700">
                {item}
                <button onClick={() => removeExpertise(item)} className="ml-2 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Behavioral Constraints</Label>
          <Textarea
            value={persona.constraints}
            onChange={(e) => setPersona({ ...persona, constraints: e.target.value })}
            placeholder="e.g., Never make assumptions, always ask for clarification..."
            className="bg-slate-800 border-slate-700 resize-none"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Custom System Prompt (Advanced)</Label>
          <Textarea
            value={persona.system_prompt}
            onChange={(e) => setPersona({ ...persona, system_prompt: e.target.value })}
            placeholder="Override default system instructions..."
            className="bg-slate-800 border-slate-700 resize-none font-mono text-xs"
            rows={4}
          />
        </div>

        <Button onClick={savePersona} disabled={isSaving} className="w-full bg-green-600 hover:bg-green-700">
          {isSaving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" />Save Persona</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}