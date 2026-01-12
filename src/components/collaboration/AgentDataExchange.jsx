/**
 * @fileoverview Agent Data Exchange Component
 * @description Manages complex data structure passing between agents
 * @version 1.0.0
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Database, FileJson, Check, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AgentDataExchange({ sourceAgent, targetAgent, onExchangeComplete }) {
  const [dataType, setDataType] = useState('json');
  const [data, setData] = useState('');
  const [metadata, setMetadata] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(null);

  const validateData = () => {
    setIsValidating(true);
    try {
      if (dataType === 'json') {
        JSON.parse(data);
      }
      setIsValid(true);
      toast.success('Data structure is valid');
    } catch (error) {
      setIsValid(false);
      toast.error('Invalid data structure: ' + error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExchange = async () => {
    try {
      const user = await base44.auth.me();
      
      // Create collaboration record
      await base44.entities.AgentCollaboration.create({
        agent_ids: [sourceAgent.id, targetAgent.id],
        collaboration_type: 'data_exchange',
        shared_context: {
          dataType,
          data: dataType === 'json' ? JSON.parse(data) : data,
          metadata,
          timestamp: new Date().toISOString(),
        },
        status: 'active',
        org_id: user.organization?.id || 'org_acme',
      });

      toast.success('Data exchanged successfully');
      onExchangeComplete?.();
    } catch (error) {
      console.error('Failed to exchange data:', error);
      toast.error('Failed to exchange data');
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          Agent Data Exchange
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-lg">
          <div className="flex-1">
            <Badge className="bg-blue-600">{sourceAgent?.name || 'Source Agent'}</Badge>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400" />
          <div className="flex-1 text-right">
            <Badge className="bg-purple-600">{targetAgent?.name || 'Target Agent'}</Badge>
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-2 block">Data Type</label>
          <Select value={dataType} onValueChange={setDataType}>
            <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="json">JSON Object</SelectItem>
              <SelectItem value="array">Array</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="binary">Binary Data</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-400">Data Payload</label>
            {isValid !== null && (
              <div className="flex items-center gap-1 text-xs">
                {isValid ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Valid</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    <span className="text-red-400">Invalid</span>
                  </>
                )}
              </div>
            )}
          </div>
          <Textarea
            value={data}
            onChange={(e) => {
              setData(e.target.value);
              setIsValid(null);
            }}
            placeholder={
              dataType === 'json' 
                ? '{"key": "value", "nested": {"data": true}}'
                : 'Enter your data here...'
            }
            className="bg-slate-950 border-slate-700 text-white font-mono text-sm resize-none h-48"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={validateData}
            disabled={isValidating || !data}
            variant="outline"
            className="flex-1 border-slate-700"
          >
            <FileJson className="w-4 h-4 mr-2" />
            Validate
          </Button>
          <Button
            onClick={handleExchange}
            disabled={!isValid || !data}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Exchange Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}