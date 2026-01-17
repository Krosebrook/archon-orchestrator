import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Upload, Code, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import AIConnectorAssistant from '../components/connectors/AIConnectorAssistant';
import OperationValidator from '../components/connectors/OperationValidator';

export default function ConnectorSubmission() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    provider: '',
    category: 'custom',
    icon_url: '',
    auth_type: 'api_key',
    auth_config: {},
    operations: [],
    webhook_support: false,
    webhook_config: {},
  });

  const [currentOperation, setCurrentOperation] = useState({
    id: '',
    name: '',
    description: '',
    method: 'GET',
    endpoint: '',
    input_schema: '{}',
    output_schema: '{}',
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ConnectorDefinition.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['connectors']);
      toast.success('Connector submitted successfully! It will be reviewed before appearing in the marketplace.');
      navigate(createPageUrl('ConnectorMarketplace'));
    },
    onError: (error) => {
      toast.error('Failed to submit connector: ' + error.message);
    },
  });

  const handleApplyAISuggestions = (suggestions) => {
    setFormData({
      ...formData,
      name: suggestions.name || formData.name,
      provider: suggestions.provider || formData.provider,
      description: suggestions.description || formData.description,
      category: suggestions.category || formData.category,
      auth_type: suggestions.auth_type || formData.auth_type,
      auth_config: suggestions.auth_config_suggestions || formData.auth_config,
      operations: suggestions.operations || formData.operations,
    });
    toast.success('AI suggestions applied successfully!');
  };

  const handleApplySchemaFix = (improvedSchemas) => {
    setCurrentOperation({
      ...currentOperation,
      input_schema: JSON.stringify(improvedSchemas.input_schema, null, 2),
      output_schema: JSON.stringify(improvedSchemas.output_schema, null, 2),
    });
    toast.success('AI improvements applied to schemas');
  };

  const addOperation = () => {
    if (!currentOperation.id || !currentOperation.name) {
      toast.error('Operation ID and name are required');
      return;
    }

    try {
      const inputSchema = JSON.parse(currentOperation.input_schema);
      const outputSchema = JSON.parse(currentOperation.output_schema);

      setFormData({
        ...formData,
        operations: [
          ...formData.operations,
          {
            ...currentOperation,
            input_schema: inputSchema,
            output_schema: outputSchema,
          },
        ],
      });

      setCurrentOperation({
        id: '',
        name: '',
        description: '',
        method: 'GET',
        endpoint: '',
        input_schema: '{}',
        output_schema: '{}',
      });

      toast.success('Operation added');
    } catch (error) {
      toast.error('Invalid JSON schema: ' + error.message);
    }
  };

  const removeOperation = (index) => {
    setFormData({
      ...formData,
      operations: formData.operations.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.provider || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.operations.length === 0) {
      toast.error('Please add at least one operation');
      return;
    }

    submitMutation.mutate({
      ...formData,
      is_marketplace: false,
      is_official: false,
      status: 'beta',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('ConnectorMarketplace'))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>
        <h1 className="text-3xl font-bold">Submit Custom Connector</h1>
        <p className="text-slate-400 mt-2">
          Create and submit your custom connector to extend Archon's integration capabilities.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* AI Assistant */}
        <AIConnectorAssistant onApplySuggestions={handleApplyAISuggestions} />

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Provide the core details about your connector
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Connector Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., GitHub Integration"
                required
              />
            </div>

            <div>
              <Label htmlFor="provider">Provider *</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g., github, custom"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what your connector does and its key features"
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crm">CRM</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="project_management">Project Management</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="icon_url">Icon URL</Label>
              <Input
                id="icon_url"
                value={formData.icon_url}
                onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                placeholder="https://example.com/icon.png"
              />
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Authentication Configuration
            </CardTitle>
            <CardDescription>
              Define how users will authenticate with your connector
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="auth_type">Authentication Type</Label>
              <Select
                value={formData.auth_type}
                onValueChange={(value) => setFormData({ ...formData, auth_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.auth_type === 'oauth2' && (
              <>
                <div>
                  <Label>OAuth Authorize URL</Label>
                  <Input
                    value={formData.auth_config.oauth_authorize_url || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        auth_config: { ...formData.auth_config, oauth_authorize_url: e.target.value },
                      })
                    }
                    placeholder="https://provider.com/oauth/authorize"
                  />
                </div>
                <div>
                  <Label>OAuth Token URL</Label>
                  <Input
                    value={formData.auth_config.oauth_token_url || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        auth_config: { ...formData.auth_config, oauth_token_url: e.target.value },
                      })
                    }
                    placeholder="https://provider.com/oauth/token"
                  />
                </div>
                <div>
                  <Label>OAuth Scopes (comma-separated)</Label>
                  <Input
                    value={formData.auth_config.oauth_scopes?.join(', ') || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        auth_config: {
                          ...formData.auth_config,
                          oauth_scopes: e.target.value.split(',').map((s) => s.trim()),
                        },
                      })
                    }
                    placeholder="read, write, admin"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Operations */}
        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
            <CardDescription>
              Define the operations (API endpoints) your connector supports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Operation ID *</Label>
                <Input
                  value={currentOperation.id}
                  onChange={(e) => setCurrentOperation({ ...currentOperation, id: e.target.value })}
                  placeholder="e.g., list_repos"
                />
              </div>
              <div>
                <Label>Operation Name *</Label>
                <Input
                  value={currentOperation.name}
                  onChange={(e) => setCurrentOperation({ ...currentOperation, name: e.target.value })}
                  placeholder="e.g., List Repositories"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={currentOperation.description}
                onChange={(e) =>
                  setCurrentOperation({ ...currentOperation, description: e.target.value })
                }
                placeholder="What this operation does"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>HTTP Method</Label>
                <Select
                  value={currentOperation.method}
                  onValueChange={(value) => setCurrentOperation({ ...currentOperation, method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Endpoint</Label>
                <Input
                  value={currentOperation.endpoint}
                  onChange={(e) =>
                    setCurrentOperation({ ...currentOperation, endpoint: e.target.value })
                  }
                  placeholder="/api/v1/repos"
                />
              </div>
            </div>

            <div>
              <Label>Input Schema (JSON)</Label>
              <Textarea
                value={currentOperation.input_schema}
                onChange={(e) =>
                  setCurrentOperation({ ...currentOperation, input_schema: e.target.value })
                }
                placeholder='{"type": "object", "properties": {...}}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label>Output Schema (JSON)</Label>
              <Textarea
                value={currentOperation.output_schema}
                onChange={(e) =>
                  setCurrentOperation({ ...currentOperation, output_schema: e.target.value })
                }
                placeholder='{"type": "object", "properties": {...}}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <Button type="button" onClick={addOperation} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Operation
            </Button>

            {currentOperation.id && currentOperation.name && (
              <OperationValidator 
                operation={{
                  ...currentOperation,
                  input_schema: (() => {
                    try { return JSON.parse(currentOperation.input_schema); } catch { return {}; }
                  })(),
                  output_schema: (() => {
                    try { return JSON.parse(currentOperation.output_schema); } catch { return {}; }
                  })(),
                }}
                onApplyFix={handleApplySchemaFix}
              />
            )}

            {formData.operations.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label>Added Operations ({formData.operations.length})</Label>
                {formData.operations.map((op, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{op.name}</div>
                      <div className="text-sm text-slate-400">
                        {op.method} {op.endpoint}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOperation(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(createPageUrl('ConnectorMarketplace'))}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {submitMutation.isPending ? (
              'Submitting...'
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Submit Connector
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}