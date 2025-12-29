import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Database, 
  Plus, 
  Upload, 
  Search, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  BarChart3,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function RAGManagement() {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedKB, setSelectedKB] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [kbs, docs] = await Promise.all([
        base44.entities.KnowledgeBase.list('-created_date'),
        base44.entities.Document.list('-created_date', 100),
      ]);
      setKnowledgeBases(kbs);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load knowledge bases');
    } finally {
      setIsLoading(false);
    }
  };

  const statusConfig = {
    active: { color: 'text-green-400', icon: CheckCircle2 },
    indexing: { color: 'text-blue-400', icon: Loader2 },
    error: { color: 'text-red-400', icon: AlertCircle },
    archived: { color: 'text-slate-400', icon: Database },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-purple-400" />
            RAG Knowledge Bases
          </h1>
          <p className="text-slate-400 mt-2">
            Manage vector databases and knowledge retrieval for AI agents
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              New Knowledge Base
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Knowledge Base</DialogTitle>
              <DialogDescription className="text-slate-400">
                Configure a new vector database for RAG
              </DialogDescription>
            </DialogHeader>
            <CreateKnowledgeBaseForm 
              onSuccess={() => {
                setCreateDialogOpen(false);
                loadData();
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knowledge Bases List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5" />
                Knowledge Bases ({knowledgeBases.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {knowledgeBases.map((kb) => {
                const StatusIcon = statusConfig[kb.status]?.icon || Database;
                return (
                  <button
                    key={kb.id}
                    onClick={() => setSelectedKB(kb)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedKB?.id === kb.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{kb.name}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {kb.document_count || 0} docs • {kb.total_chunks || 0} chunks
                        </div>
                      </div>
                      <StatusIcon className={`w-4 h-4 ${statusConfig[kb.status]?.color}`} />
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                      {kb.vector_config.provider} • {kb.vector_config.embedding_model}
                    </div>
                  </button>
                );
              })}
              {knowledgeBases.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No knowledge bases yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details and Documents */}
        <div className="lg:col-span-2">
          {selectedKB ? (
            <Tabs defaultValue="documents" className="space-y-4">
              <TabsList className="bg-slate-800">
                <TabsTrigger value="documents">
                  <FileText className="w-4 h-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="config">
                  <Settings className="w-4 h-4 mr-2" />
                  Configuration
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="documents">
                <DocumentManager 
                  knowledgeBase={selectedKB} 
                  documents={documents.filter(d => d.knowledge_base_id === selectedKB.id)}
                  onRefresh={loadData}
                />
              </TabsContent>

              <TabsContent value="config">
                <KnowledgeBaseConfig knowledgeBase={selectedKB} onUpdate={loadData} />
              </TabsContent>

              <TabsContent value="analytics">
                <RAGAnalytics knowledgeBaseId={selectedKB.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="flex flex-col items-center justify-center h-96 text-slate-400">
                <Database className="w-16 h-16 mb-4 opacity-50" />
                <p>Select a knowledge base to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateKnowledgeBaseForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    provider: 'pinecone',
    index_name: '',
    embedding_model: 'text-embedding-3-small',
    distance_metric: 'cosine',
    chunking_strategy: 'semantic',
    chunk_size: 1000,
    chunk_overlap: 200,
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const user = await base44.auth.me();
      await base44.entities.KnowledgeBase.create({
        name: formData.name,
        description: formData.description,
        status: 'active',
        vector_config: {
          provider: formData.provider,
          index_name: formData.index_name,
          embedding_model: formData.embedding_model,
          dimensions: formData.embedding_model === 'text-embedding-3-small' ? 1536 : 3072,
          distance_metric: formData.distance_metric,
        },
        chunking_config: {
          strategy: formData.chunking_strategy,
          chunk_size: formData.chunk_size,
          chunk_overlap: formData.chunk_overlap,
        },
        tags: [],
        org_id: user.organization.id,
      });

      toast.success('Knowledge base created successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to create knowledge base:', error);
      toast.error('Failed to create knowledge base');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Customer Support KB"
          className="bg-slate-800 border-slate-700"
          required
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Knowledge base for customer support documentation"
          className="bg-slate-800 border-slate-700"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Vector Provider</Label>
          <Select
            value={formData.provider}
            onValueChange={(value) => setFormData({ ...formData, provider: value })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="pinecone">Pinecone</SelectItem>
              <SelectItem value="weaviate">Weaviate</SelectItem>
              <SelectItem value="qdrant">Qdrant</SelectItem>
              <SelectItem value="chroma">Chroma</SelectItem>
              <SelectItem value="supabase">Supabase</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Index Name</Label>
          <Input
            value={formData.index_name}
            onChange={(e) => setFormData({ ...formData, index_name: e.target.value })}
            placeholder="customer-support-index"
            className="bg-slate-800 border-slate-700"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Embedding Model</Label>
          <Select
            value={formData.embedding_model}
            onValueChange={(value) => setFormData({ ...formData, embedding_model: value })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="text-embedding-3-small">text-embedding-3-small (1536d)</SelectItem>
              <SelectItem value="text-embedding-3-large">text-embedding-3-large (3072d)</SelectItem>
              <SelectItem value="text-embedding-ada-002">text-embedding-ada-002 (legacy)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Distance Metric</Label>
          <Select
            value={formData.distance_metric}
            onValueChange={(value) => setFormData({ ...formData, distance_metric: value })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="cosine">Cosine</SelectItem>
              <SelectItem value="euclidean">Euclidean</SelectItem>
              <SelectItem value="dot_product">Dot Product</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Chunking Strategy</Label>
          <Select
            value={formData.chunking_strategy}
            onValueChange={(value) => setFormData({ ...formData, chunking_strategy: value })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="fixed">Fixed</SelectItem>
              <SelectItem value="semantic">Semantic</SelectItem>
              <SelectItem value="recursive">Recursive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Chunk Size</Label>
          <Input
            type="number"
            value={formData.chunk_size}
            onChange={(e) => setFormData({ ...formData, chunk_size: parseInt(e.target.value) })}
            className="bg-slate-800 border-slate-700"
          />
        </div>

        <div>
          <Label>Chunk Overlap</Label>
          <Input
            type="number"
            value={formData.chunk_overlap}
            onChange={(e) => setFormData({ ...formData, chunk_overlap: parseInt(e.target.value) })}
            className="bg-slate-800 border-slate-700"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isCreating} className="bg-purple-600 hover:bg-purple-700">
          {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Knowledge Base
        </Button>
      </div>
    </form>
  );
}

function DocumentManager({ knowledgeBase, documents, onRefresh }) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Documents</CardTitle>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <UploadDocumentForm 
                knowledgeBase={knowledgeBase}
                onSuccess={() => {
                  setUploadDialogOpen(false);
                  onRefresh();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} knowledgeBase={knowledgeBase} onRefresh={onRefresh} />
          ))}
          {documents.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No documents uploaded yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentCard({ document, knowledgeBase, onRefresh }) {
  const [isIndexing, setIsIndexing] = useState(false);

  const handleIndex = async () => {
    setIsIndexing(true);
    try {
      const response = await base44.functions.invoke('embedDocument', {
        document_id: document.id,
        knowledge_base_id: knowledgeBase.id,
      });

      if (response.success) {
        toast.success(`Document indexed: ${response.chunks_created} chunks created`);
        onRefresh();
      } else {
        toast.error('Failed to index document');
      }
    } catch (error) {
      console.error('Index error:', error);
      toast.error('Failed to index document');
    } finally {
      setIsIndexing(false);
    }
  };

  const statusConfig = {
    pending: { color: 'bg-yellow-500', text: 'Pending' },
    processing: { color: 'bg-blue-500', text: 'Processing' },
    indexed: { color: 'bg-green-500', text: 'Indexed' },
    failed: { color: 'bg-red-500', text: 'Failed' },
  };

  return (
    <div className="p-3 bg-slate-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-white">{document.title}</div>
          <div className="text-xs text-slate-400 mt-1">
            {document.chunk_count || 0} chunks • {document.content_type}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusConfig[document.status].color}`} />
          <span className="text-xs text-slate-400">{statusConfig[document.status].text}</span>
          {document.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleIndex}
              disabled={isIndexing}
              className="ml-2"
            >
              {isIndexing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Index'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadDocumentForm({ knowledgeBase, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    content_type: 'text',
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const user = await base44.auth.me();
      await base44.entities.Document.create({
        knowledge_base_id: knowledgeBase.id,
        title: formData.title,
        content: formData.content,
        content_type: formData.content_type,
        status: 'pending',
        metadata: {},
        org_id: user.organization.id,
      });

      toast.success('Document uploaded successfully');
      onSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Document title"
          className="bg-slate-800 border-slate-700"
          required
        />
      </div>

      <div>
        <Label>Content</Label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Document content..."
          className="bg-slate-800 border-slate-700 min-h-[200px]"
          required
        />
      </div>

      <div>
        <Label>Content Type</Label>
        <Select
          value={formData.content_type}
          onValueChange={(value) => setFormData({ ...formData, content_type: value })}
        >
          <SelectTrigger className="bg-slate-800 border-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="markdown">Markdown</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="code">Code</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isUploading} className="bg-blue-600 hover:bg-blue-700">
          {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Upload
        </Button>
      </div>
    </form>
  );
}

function KnowledgeBaseConfig({ knowledgeBase, onUpdate }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Vector Database</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-500">Provider</Label>
              <div className="text-white">{knowledgeBase.vector_config.provider}</div>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Index</Label>
              <div className="text-white">{knowledgeBase.vector_config.index_name}</div>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Embedding Model</Label>
              <div className="text-white">{knowledgeBase.vector_config.embedding_model}</div>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Distance Metric</Label>
              <div className="text-white">{knowledgeBase.vector_config.distance_metric}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Chunking Strategy</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-slate-500">Strategy</Label>
              <div className="text-white">{knowledgeBase.chunking_config?.strategy || 'semantic'}</div>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Chunk Size</Label>
              <div className="text-white">{knowledgeBase.chunking_config?.chunk_size || 1000}</div>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Overlap</Label>
              <div className="text-white">{knowledgeBase.chunking_config?.chunk_overlap || 200}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RAGAnalytics({ knowledgeBaseId }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [knowledgeBaseId]);

  const loadLogs = async () => {
    try {
      const retrievalLogs = await base44.entities.RetrievalLog.filter(
        { knowledge_base_id: knowledgeBaseId },
        '-timestamp',
        50
      );
      setLogs(retrievalLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />;
  }

  const avgLatency = logs.length > 0 
    ? (logs.reduce((sum, log) => sum + log.latency_ms, 0) / logs.length).toFixed(0)
    : 0;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Retrieval Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-400">Total Queries</div>
            <div className="text-2xl font-bold text-white mt-1">{logs.length}</div>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-400">Avg Latency</div>
            <div className="text-2xl font-bold text-white mt-1">{avgLatency}ms</div>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-400">Avg Results</div>
            <div className="text-2xl font-bold text-white mt-1">
              {logs.length > 0 
                ? (logs.reduce((sum, log) => sum + log.results.length, 0) / logs.length).toFixed(1)
                : 0}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Recent Queries</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-800 rounded-lg">
                <div className="text-sm text-white">{log.query}</div>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span>{log.results.length} results</span>
                  <span>{log.latency_ms}ms</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}