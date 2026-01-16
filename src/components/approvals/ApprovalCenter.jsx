import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ApprovalRequest } from '@/entities/ApprovalRequest';
import { Clock, CheckCircle, XCircle, User, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ApprovalCenter() {
  const [requests, setRequests] = useState([]);
  const [_isLoading, _setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decisionReason, setDecisionReason] = useState('');

  useEffect(() => {
    loadApprovalRequests();
  }, []);

  const loadApprovalRequests = async () => {
    setIsLoading(true);
    try {
      const data = await ApprovalRequest.filter({ status: 'pending' }, '-created_date');
      setRequests(data);
    } catch (error) {
      console.error('Failed to load approval requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (requestId, decision) => {
    try {
      await ApprovalRequest.update(requestId, {
        status: decision,
        approved_by: 'current.user@acme.com', // Would be actual user
        decision_reason: decisionReason,
      });
      
      setSelectedRequest(null);
      setDecisionReason('');
      loadApprovalRequests();
    } catch (error) {
      console.error('Failed to update approval request:', error);
    }
  };

  const RequestCard = ({ request, onSelect }) => (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
          onClick={() => onSelect(request)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm font-medium">
            {request.step_name}
          </CardTitle>
          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <p className="text-slate-400 text-sm">
            Run ID: <span className="font-mono">{request.run_id.substring(0, 8)}...</span>
          </p>
          <p className="text-slate-500 text-xs">
            Requested {formatDistanceToNow(new Date(request.created_date), { addSuffix: true })}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Approval Center</h2>
          <p className="text-slate-400">Review and approve pending workflow steps</p>
        </div>
        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          {requests.length} pending
        </Badge>
      </div>

      {requests.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">All Caught Up!</h3>
            <p className="text-slate-400">No approval requests pending at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Pending Requests</h3>
            {requests.map(request => (
              <RequestCard 
                key={request.id} 
                request={request} 
                onSelect={setSelectedRequest}
              />
            ))}
          </div>

          <div>
            {selectedRequest ? (
              <Card className="bg-slate-900 border-slate-800 sticky top-4">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Approval Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white font-medium mb-2">Step Information</h4>
                      <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                        <p className="text-slate-300">
                          <span className="text-slate-500">Name:</span> {selectedRequest.step_name}
                        </p>
                        <p className="text-slate-300">
                          <span className="text-slate-500">Run:</span> 
                          <span className="font-mono ml-1">{selectedRequest.run_id}</span>
                        </p>
                        <p className="text-slate-300">
                          <span className="text-slate-500">Workflow:</span> 
                          <span className="font-mono ml-1">{selectedRequest.workflow_id}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-2">Request Data</h4>
                      <div className="bg-slate-800 rounded-lg p-4">
                        <pre className="text-slate-300 text-sm font-mono overflow-x-auto">
                          {JSON.stringify(selectedRequest.request_data, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-2">Decision Reason (Optional)</h4>
                      <Textarea
                        value={decisionReason}
                        onChange={(e) => setDecisionReason(e.target.value)}
                        placeholder="Explain your decision..."
                        className="bg-slate-800 border-slate-700 text-white"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleDecision(selectedRequest.id, 'approved')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleDecision(selectedRequest.id, 'rejected')}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Select a Request</h3>
                  <p className="text-slate-400">Click on a pending request to review the details.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}