import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plug,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import ConnectorDetailDialog from '../components/connectors/ConnectorDetailDialog';
import ConnectorTestDialog from '../components/connectors/ConnectorTestDialog';
import ReviewFeedbackDialog from '../components/connectors/ReviewFeedbackDialog';

export default function MyConnectorSubmissions() {
  const navigate = useNavigate();
  const [connectors, setConnectors] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [testingConnector, setTestingConnector] = useState(null);
  const [reviewDialogConnector, setReviewDialogConnector] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [connectorsData, reviewsData] = await Promise.all([
        base44.entities.ConnectorDefinition.filter({ is_official: false }),
        base44.entities.ConnectorReview.list('-created_date'),
      ]);
      setConnectors(connectorsData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (connectorId) => {
    if (!confirm('Are you sure you want to delete this connector? This action cannot be undone.')) {
      return;
    }

    try {
      await base44.entities.ConnectorDefinition.delete(connectorId);
      toast.success('Connector deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete connector: ' + error.message);
    }
  };

  const handleTogglePublish = async (connector) => {
    try {
      await base44.entities.ConnectorDefinition.update(connector.id, {
        is_marketplace: !connector.is_marketplace,
      });
      toast.success(
        connector.is_marketplace
          ? 'Connector unpublished from marketplace'
          : 'Connector published to marketplace'
      );
      loadData();
    } catch (error) {
      toast.error('Failed to update connector: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      active: { color: 'bg-green-500', icon: CheckCircle2, label: 'Active' },
      beta: { color: 'bg-yellow-500', icon: Clock, label: 'Beta' },
      deprecated: { color: 'bg-red-500', icon: XCircle, label: 'Deprecated' },
    };
    const config = configs[status] || configs.beta;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getConnectorReviews = (connectorId) => {
    return reviews.filter((r) => r.connector_id === connectorId);
  };

  const renderConnectorCard = (connector) => {
    const connectorReviews = getConnectorReviews(connector.id);
    const latestReview = connectorReviews[0];
    const hasUnreadFeedback = latestReview && latestReview.status === 'changes_requested';

    return (
      <Card key={connector.id} className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {connector.icon_url ? (
                  <img src={connector.icon_url} alt="" className="w-10 h-10 rounded-lg" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Plug className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-white">{connector.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(connector.status)}
                    {connector.is_marketplace && (
                      <Badge variant="outline" className="text-xs">
                        Published
                      </Badge>
                    )}
                    {hasUnreadFeedback && (
                      <Badge className="bg-orange-500 text-white">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Feedback
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-400 line-clamp-2">{connector.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400">Provider:</span>
                <span className="ml-2 text-white">{connector.provider}</span>
              </div>
              <div>
                <span className="text-slate-400">Category:</span>
                <span className="ml-2 text-white capitalize">{connector.category}</span>
              </div>
              <div>
                <span className="text-slate-400">Operations:</span>
                <span className="ml-2 text-white">{connector.operations?.length || 0}</span>
              </div>
              <div>
                <span className="text-slate-400">Installs:</span>
                <span className="ml-2 text-white">{connector.installation_count || 0}</span>
              </div>
            </div>

            {latestReview && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  latestReview.status === 'approved'
                    ? 'bg-green-900/20 border border-green-800'
                    : latestReview.status === 'rejected'
                    ? 'bg-red-900/20 border border-red-800'
                    : 'bg-orange-900/20 border border-orange-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">Latest Review</span>
                  {latestReview.status === 'changes_requested' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReviewDialogConnector(connector)}
                      className="h-7 text-xs"
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      View Feedback ({latestReview.feedback?.length || 0})
                    </Button>
                  )}
                </div>
                <p className="text-slate-300">{latestReview.comments}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedConnector(connector)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTestingConnector(connector)}
                className="flex-1"
              >
                <Plug className="w-4 h-4 mr-2" />
                Test
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(createPageUrl('ConnectorSubmission') + `?edit=${connector.id}`)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTogglePublish(connector)}
              >
                {connector.is_marketplace ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(connector.id)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const activeConnectors = connectors.filter((c) => c.status === 'active');
  const betaConnectors = connectors.filter((c) => c.status === 'beta');
  const deprecatedConnectors = connectors.filter((c) => c.status === 'deprecated');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Plug className="w-8 h-8 text-blue-400" />
            My Connector Submissions
          </h1>
          <p className="text-slate-400 mt-2">Manage your custom connectors and view review feedback</p>
        </div>
        <Button
          onClick={() => navigate(createPageUrl('ConnectorSubmission'))}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Submit New Connector
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Submissions</p>
                <p className="text-2xl font-bold text-white mt-1">{connectors.length}</p>
              </div>
              <Plug className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Published</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {connectors.filter((c) => c.is_marketplace).length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Pending Feedback</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {
                    reviews.filter((r) => r.status === 'changes_requested' && r.connector_id).length
                  }
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="all">All ({connectors.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeConnectors.length})</TabsTrigger>
          <TabsTrigger value="beta">Beta ({betaConnectors.length})</TabsTrigger>
          <TabsTrigger value="deprecated">Deprecated ({deprecatedConnectors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {connectors.map((c) => renderConnectorCard(c))}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeConnectors.map((c) => renderConnectorCard(c))}
          </div>
        </TabsContent>

        <TabsContent value="beta">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {betaConnectors.map((c) => renderConnectorCard(c))}
          </div>
        </TabsContent>

        <TabsContent value="deprecated">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {deprecatedConnectors.map((c) => renderConnectorCard(c))}
          </div>
        </TabsContent>
      </Tabs>

      {connectors.length === 0 && (
        <div className="text-center py-12">
          <Plug className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">No Connectors Yet</h3>
          <p className="text-slate-400 mb-4">
            Start building custom connectors to extend Archon's capabilities
          </p>
          <Button
            onClick={() => navigate(createPageUrl('ConnectorSubmission'))}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Connector
          </Button>
        </div>
      )}

      {selectedConnector && (
        <ConnectorDetailDialog
          connector={selectedConnector}
          open={!!selectedConnector}
          onClose={() => setSelectedConnector(null)}
        />
      )}

      {testingConnector && (
        <ConnectorTestDialog
          connector={testingConnector}
          open={!!testingConnector}
          onClose={() => setTestingConnector(null)}
        />
      )}

      {reviewDialogConnector && (
        <ReviewFeedbackDialog
          connector={reviewDialogConnector}
          reviews={getConnectorReviews(reviewDialogConnector.id)}
          open={!!reviewDialogConnector}
          onClose={() => setReviewDialogConnector(null)}
        />
      )}
    </div>
  );
}