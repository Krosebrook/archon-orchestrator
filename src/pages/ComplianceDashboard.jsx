import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileCheck, AlertTriangle, Eye, Plus, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import PrivacyPolicyManager from '../components/compliance/PrivacyPolicyManager';
import ComplianceReports from '../components/compliance/ComplianceReports';
import RedactionLogs from '../components/compliance/RedactionLogs';
import ExplainabilityDashboard from '../components/compliance/ExplainabilityDashboard';

export default function ComplianceDashboard() {
  const [policies, setPolicies] = useState([]);
  const [reports, setReports] = useState([]);
  const [redactionLogs, setRedactionLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [policyData, reportData, logData] = await Promise.all([
        base44.entities.DataPrivacyPolicy.list('-created_date'),
        base44.entities.ComplianceReport.list('-created_date', 20),
        base44.entities.DataRedactionLog.list('-timestamp', 100),
      ]);
      
      setPolicies(policyData);
      setReports(reportData);
      setRedactionLogs(logData);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async (reportType) => {
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateComplianceReport', {
        report_type: reportType,
        days_back: 30,
      });

      if (response.success) {
        toast.success(`${reportType.toUpperCase()} compliance report generated`);
        loadData();
      }
    } catch (error) {
      console.error('Report generation failed:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const latestReport = reports[0];
  const activePolicies = policies.filter(p => p.status === 'active').length;
  const totalRedactions = redactionLogs.reduce((sum, log) => sum + log.redaction_count, 0);

  const statusConfig = {
    compliant: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-900/20' },
    at_risk: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
    non_compliant: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20' },
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
            <Shield className="w-8 h-8 text-blue-400" />
            Compliance & Privacy
          </h1>
          <p className="text-slate-400 mt-2">
            GDPR/CCPA compliance, data privacy, and AI transparency
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => generateReport('gdpr')}
            disabled={isGenerating}
            variant="outline"
            className="border-blue-600 text-blue-400"
          >
            {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            GDPR Report
          </Button>
          <Button
            onClick={() => generateReport('ccpa')}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            CCPA Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Compliance Status</p>
                {latestReport ? (
                  <>
                    <p className="text-2xl font-bold text-white mt-1 capitalize">
                      {latestReport.status.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {latestReport.report_type.toUpperCase()} • Last {new Date(latestReport.created_date).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <p className="text-lg text-slate-500 mt-1">No reports yet</p>
                )}
              </div>
              {latestReport && (() => {
                const StatusIcon = statusConfig[latestReport.status].icon;
                return <StatusIcon className={`w-8 h-8 ${statusConfig[latestReport.status].color}`} />;
              })()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Policies</p>
                <p className="text-2xl font-bold text-white mt-1">{activePolicies}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {policies.length} total policies
                </p>
              </div>
              <FileCheck className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Data Redactions</p>
                <p className="text-2xl font-bold text-white mt-1">{totalRedactions}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {redactionLogs.length} redaction events
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Violations</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {latestReport?.violations?.length || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {latestReport?.violations?.filter(v => v.severity === 'critical').length || 0} critical
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="policies">
            <Shield className="w-4 h-4 mr-2" />
            Privacy Policies
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileCheck className="w-4 h-4 mr-2" />
            Compliance Reports
          </TabsTrigger>
          <TabsTrigger value="redaction">
            <Eye className="w-4 h-4 mr-2" />
            Redaction Logs
          </TabsTrigger>
          <TabsTrigger value="explainability">
            <AlertTriangle className="w-4 h-4 mr-2" />
            AI Explainability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="policies">
          <PrivacyPolicyManager policies={policies} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="reports">
          <ComplianceReports reports={reports} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="redaction">
          <RedactionLogs logs={redactionLogs} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="explainability">
          <ExplainabilityDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}