import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ApprovalCenter() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const data = await base44.entities.ApprovalRequest.filter(
        { status: 'pending' },
        '-created_date',
        50
      );
      setRequests(data);
    } catch (error) {
      console.error('Failed to load approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setProcessing(true);
    try {
      await base44.functions.invoke('approveDeployment', {
        request_id: requestId,
        action: 'approve',
        comments: comments.trim()
      });
      
      toast.success('Deployment approved');
      setComments('');
      setSelectedRequest(null);
      await loadRequests();
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error(error.message || 'Approval failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!comments.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      await base44.functions.invoke('approveDeployment', {
        request_id: requestId,
        action: 'reject',
        comments: comments.trim()
      });
      
      toast.success('Deployment rejected');
      setComments('');
      setSelectedRequest(null);
      await loadRequests();
    } catch (error) {
      console.error('Rejection failed:', error);
      toast.error(error.message || 'Rejection failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Approvals
          </CardTitle>
          {requests.length > 0 && (
            <Badge variant="destructive">{requests.length} pending</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-slate-400">No pending approvals</p>
          </div>
        ) : (
          requests.map((request) => {
            const isExpired = request.expires_at && new Date(request.expires_at) < new Date();
            const isSelected = selectedRequest?.id === request.id;

            return (
              <div
                key={request.id}
                className={`p-4 rounded-lg border ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium mb-1">Workflow ID: {request.workflow_id.slice(0, 12)}...</div>
                    <div className="text-sm text-slate-400">
                      Version: <Badge variant="outline">{request.version}</Badge>
                      {' → '}
                      <Badge className={
                        request.environment === 'production' ? 'bg-red-600' : 'bg-amber-600'
                      }>
                        {request.environment}
                      </Badge>
                    </div>
                  </div>
                  {isExpired && (
                    <Badge variant="destructive">Expired</Badge>
                  )}
                </div>

                {request.comments && (
                  <div className="mb-3 p-2 bg-slate-950 rounded text-sm text-slate-300">
                    {request.comments}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <span>Requested by: {request.requested_by}</span>
                  <span>•</span>
                  <span>{format(new Date(request.created_date), 'PPp')}</span>
                </div>

                {!isExpired && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRequest(isSelected ? null : request)}
                      className="w-full mb-2"
                    >
                      {isSelected ? 'Hide Details' : 'Review'}
                    </Button>

                    {isSelected && (
                      <div className="space-y-3 pt-3 border-t border-slate-700">
                        <Textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Add comments (required for rejection)..."
                          className="border-slate-700"
                          rows={3}
                        />

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(request.id)}
                            disabled={processing}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(request.id)}
                            disabled={processing}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}