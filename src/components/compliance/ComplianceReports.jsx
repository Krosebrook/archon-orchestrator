import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ComplianceReports({ reports, _onRefresh }) {
  if (reports.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="flex flex-col items-center justify-center h-96 text-slate-400">
          <FileText className="w-16 h-16 mb-4 opacity-50" />
          <p>No compliance reports yet</p>
          <p className="text-sm mt-2">Generate GDPR or CCPA reports to track compliance</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}

function ReportCard({ report }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const statusConfig = {
    compliant: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-700' },
    at_risk: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-700' },
    non_compliant: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-700' },
  };

  const config = statusConfig[report.status];
  const StatusIcon = config.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`bg-slate-900 ${config.border} border`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={`w-6 h-6 ${config.color}`} />
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  {report.report_type.toUpperCase()} Compliance Report
                  <Badge variant="outline" className="capitalize">
                    {report.status.replace('_', ' ')}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-slate-400 mt-1">
                  {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                </p>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="text-slate-400">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-slate-800 rounded">
              <div className="text-2xl font-bold text-white">{report.metrics.redaction_events}</div>
              <div className="text-xs text-slate-400">Redactions</div>
            </div>
            <div className="text-center p-3 bg-slate-800 rounded">
              <div className="text-2xl font-bold text-white">{report.metrics.data_access_requests}</div>
              <div className="text-xs text-slate-400">Access Requests</div>
            </div>
            <div className="text-center p-3 bg-slate-800 rounded">
              <div className="text-2xl font-bold text-white">{report.metrics.consent_granted}</div>
              <div className="text-xs text-slate-400">Consents</div>
            </div>
            <div className="text-center p-3 bg-slate-800 rounded">
              <div className="text-2xl font-bold text-white">{report.violations.length}</div>
              <div className="text-xs text-slate-400">Violations</div>
            </div>
          </div>

          <CollapsibleContent>
            {report.violations.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Violations:</h4>
                <div className="space-y-2">
                  {report.violations.map((v, i) => (
                    <div key={i} className="p-3 bg-slate-800 rounded border border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white capitalize">
                          {v.violation_type.replace(/_/g, ' ')}
                        </span>
                        <Badge className={
                          v.severity === 'critical' ? 'bg-red-900/30 text-red-300' :
                          v.severity === 'high' ? 'bg-orange-900/30 text-orange-300' :
                          'bg-yellow-900/30 text-yellow-300'
                        }>
                          {v.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">{v.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Recommendations:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                  {report.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}