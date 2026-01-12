
import { useState, useEffect } from 'react';
import { RefactorSession, RefactorRecommendation } from '@/entities/all';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, RefreshCw, History, Sparkles } from 'lucide-react';
import RefactorDashboard from '../components/refactoring/RefactorDashboard';
import RefactorProgress from '../components/refactoring/RefactorProgress';
import CodeReviewPanel from '../components/refactoring/CodeReviewPanel';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import CIPipeline from '../components/refactoring/CIPipeline';

export default function Refactoring() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const sessionData = await RefactorSession.list('-created_date', 10);
      setSessions(sessionData);
      
      if (sessionData.length > 0) {
        const latestSession = sessionData[0];
        setCurrentSession(latestSession);
        await loadRecommendations(latestSession.id);
      }
    } catch (error) {
      console.error('Failed to load refactor sessions:', error);
      toast.error('Failed to load refactoring sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendations = async (sessionId) => {
    try {
      const recData = await RefactorRecommendation.filter({ session_id: sessionId });
      setRecommendations(recData);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      toast.error('Failed to load recommendations');
    }
  };

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    toast.info('Starting codebase analysis...', { duration: 3000 });
    
    try {
      const response = await base44.functions.invoke('analyzeCodebase', {
        session_name: `Analysis ${new Date().toLocaleDateString()}`,
        scope: {
          check_categories: ['redundancy', 'performance', 'security', 'maintainability', 'schema']
        }
      });

      if (response.data.success) {
        toast.success(`Analysis complete! Found ${response.data.summary.total} recommendations`);
        await loadSessions();
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze codebase');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSessionSelect = async (session) => {
    setCurrentSession(session);
    await loadRecommendations(session.id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full bg-slate-800" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 bg-slate-800" />
          ))}
        </div>
        <Skeleton className="h-96 w-full bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Refactor Recommendations</h1>
          <p className="text-slate-400">
            Automatically detect redundancies, performance issues, and security gaps in your codebase
          </p>
        </div>
        <Button
          onClick={startAnalysis}
          disabled={isAnalyzing}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Start New Analysis
            </>
          )}
        </Button>
      </div>

      {sessions.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Analysis History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {sessions.map((session) => (
                <Button
                  key={session.id}
                  variant={currentSession?.id === session.id ? 'default' : 'outline'}
                  onClick={() => handleSessionSelect(session)}
                  className={`flex-shrink-0 ${
                    currentSession?.id === session.id
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs">{session.name}</span>
                    <span className="text-[10px] opacity-70">
                      Score: {Math.round(session.overall_score || 0)}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {currentSession && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSession.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RefactorDashboard
                  session={currentSession}
                  recommendations={recommendations}
                  onRefresh={() => loadRecommendations(currentSession.id)}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <RefactorProgress recommendations={recommendations} />
            <CodeReviewPanel onReviewComplete={() => loadSessions()} />
            <CIPipeline sessionId={currentSession.id} />
          </div>
        </div>
      )}

      {!currentSession && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Analysis Yet</h3>
                <p className="text-slate-400 mb-6">
                  Start your first codebase analysis to get AI-powered refactoring recommendations
                </p>
                <Button
                  onClick={startAnalysis}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Analysis Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border-blue-800/30">
          <CardContent className="p-6">
            <div className="text-blue-400 mb-2">🎯 Staged Approach</div>
            <p className="text-sm text-slate-300">
              Recommendations are organized into safe, sequential stages to minimize risk
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 border-purple-800/30">
          <CardContent className="p-6">
            <div className="text-purple-400 mb-2">🔄 Rollback Ready</div>
            <p className="text-sm text-slate-300">
              Every recommendation includes a clear rollback strategy for safety
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/20 to-green-950/20 border-green-800/30">
          <CardContent className="p-6">
            <div className="text-green-400 mb-2">📊 Impact Estimates</div>
            <p className="text-sm text-slate-300">
              See predicted performance gains, code reduction, and security improvements
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
