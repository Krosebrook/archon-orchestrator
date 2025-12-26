/**
 * @fileoverview Generated Workflow Preview
 * @description Preview AI-generated workflow before applying
 * @version 1.0.0
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Settings, GitBranch, Database, Mail, Webhook, Clock, DollarSign, Tag } from 'lucide-react';

const nodeIcons = {
  agent: Bot,
  tool: Settings,
  condition: GitBranch,
  data: Database,
  email: Mail,
  webhook: Webhook,
};

const nodeColors = {
  agent: 'bg-blue-500',
  tool: 'bg-green-500',
  condition: 'bg-yellow-500',
  data: 'bg-purple-500',
  email: 'bg-red-500',
  webhook: 'bg-orange-500',
};

export default function GeneratedWorkflowPreview({ workflow }) {
  if (!workflow) return null;

  const getNodeIcon = (type) => nodeIcons[type] || Bot;
  const getNodeColor = (type) => nodeColors[type] || 'bg-slate-500';

  return (
    <div className="space-y-4">
      <Card className="bg-slate-950 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">{workflow.name}</CardTitle>
          <p className="text-sm text-slate-400 mt-1">{workflow.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-600">
              {workflow.category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
            <Badge className="bg-slate-700">
              {workflow.complexity || 'intermediate'}
            </Badge>
            {workflow.tags?.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="border-slate-600 text-slate-300">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-900 rounded-lg">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock className="w-3 h-3" />
                Estimated Duration
              </div>
              <div className="text-white font-medium">
                {workflow.estimated_duration_sec ? `${Math.round(workflow.estimated_duration_sec / 60)}m` : 'N/A'}
              </div>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <DollarSign className="w-3 h-3" />
                Estimated Cost
              </div>
              <div className="text-white font-medium">
                ${workflow.estimated_cost_cents ? (workflow.estimated_cost_cents / 100).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-950 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-sm">Workflow Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-xs text-slate-400 mb-2">
              {workflow.nodes?.length || 0} Nodes • {workflow.edges?.length || 0} Connections
            </div>
            
            {workflow.nodes?.map((node, idx) => {
              const Icon = getNodeIcon(node.data.type);
              const color = getNodeColor(node.data.type);
              
              return (
                <div key={node.id} className="p-3 bg-slate-900 rounded border border-slate-800">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${color} flex-shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{node.data.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{node.data.description}</div>
                      {node.data.config && Object.keys(node.data.config).length > 0 && (
                        <div className="mt-2 text-xs text-slate-500">
                          Config: {Object.keys(node.data.config).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {workflow.edges && workflow.edges.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 mb-2">Connections:</div>
              <div className="space-y-1">
                {workflow.edges.map((edge, idx) => {
                  const sourceNode = workflow.nodes.find(n => n.id === edge.source);
                  const targetNode = workflow.nodes.find(n => n.id === edge.target);
                  
                  return (
                    <div key={edge.id} className="text-xs text-slate-500">
                      {sourceNode?.data.label || edge.source} → {targetNode?.data.label || edge.target}
                      {edge.data?.label && ` (${edge.data.label})`}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}