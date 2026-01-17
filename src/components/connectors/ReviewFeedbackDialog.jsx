import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import moment from 'moment';

export default function ReviewFeedbackDialog({ connector, reviews, open, onClose }) {
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-600';
      case 'rejected':
        return 'bg-red-600';
      case 'changes_requested':
        return 'bg-orange-600';
      default:
        return 'bg-slate-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white">Review Feedback</DialogTitle>
          <DialogDescription>
            Review comments and feedback for {connector.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400">No reviews yet</p>
            </div>
          ) : (
            reviews.map((review, index) => (
              <Card key={review.id} className="bg-slate-800 border-slate-700">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">
                          Review #{reviews.length - index}
                        </span>
                        <Badge className={getStatusColor(review.status)}>
                          {review.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">
                        by {review.reviewer_email} • {moment(review.created_date).fromNow()}
                      </p>
                    </div>
                    {review.overall_rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-white font-semibold">{review.overall_rating}/5</span>
                      </div>
                    )}
                  </div>

                  {review.comments && (
                    <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-slate-200">{review.comments}</p>
                    </div>
                  )}

                  {review.feedback && review.feedback.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-300 mb-2">Detailed Feedback:</p>
                      {review.feedback.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            item.severity === 'error'
                              ? 'bg-red-900/20 border-red-800'
                              : item.severity === 'warning'
                              ? 'bg-yellow-900/20 border-yellow-800'
                              : 'bg-blue-900/20 border-blue-800'
                          }`}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            {getSeverityIcon(item.severity)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white capitalize">
                                  {item.section}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {item.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-200 mt-1">{item.message}</p>
                              {item.suggestion && (
                                <div className="mt-2 p-2 bg-slate-950/50 rounded text-xs text-slate-300">
                                  <span className="font-medium">Suggestion:</span> {item.suggestion}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {review.security_concerns && review.security_concerns.length > 0 && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="font-medium text-red-300">Security Concerns:</span>
                      </div>
                      <ul className="space-y-1">
                        {review.security_concerns.map((concern, idx) => (
                          <li key={idx} className="text-sm text-red-200 ml-6 list-disc">
                            {concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}