import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Edit, AlertTriangle } from 'lucide-react';

export default function PolicyList({ policies, onEdit, onRefresh }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Policies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {policies.map((policy) => (
            <div key={policy.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{policy.name}</span>
                      <Badge variant="outline" className={
                        policy.enabled 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }>
                        {policy.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                      <Badge variant="outline" className="bg-slate-800 border-slate-700 text-xs capitalize">
                        {policy.enforcement}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{policy.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Scope: {policy.scope}</span>
                      {policy.violations > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                          <AlertTriangle className="w-3 h-3" />
                          {policy.violations} violations
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(policy)}
                  className="text-slate-400 hover:text-white"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}