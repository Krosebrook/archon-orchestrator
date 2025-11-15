import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestTube } from 'lucide-react';

export default function PolicySimulator({ policies }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Policy Simulator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-slate-400">
          <TestTube className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-sm">Test policies before applying</p>
        </div>
      </CardContent>
    </Card>
  );
}