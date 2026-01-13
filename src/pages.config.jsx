import { lazy, Suspense } from 'react';
import AdvancedOrchestration from './pages/AdvancedOrchestration';
import AgentAnalytics from './pages/AgentAnalytics';
import AgentCollaboration from './pages/AgentCollaboration';
import AgentDebugger from './pages/AgentDebugger';
import AgentDetail from './pages/AgentDetail';
import AgentTraining from './pages/AgentTraining';
import AgentWorkflowDesigner from './pages/AgentWorkflowDesigner';
import Agents from './pages/Agents';
import Analytics from './pages/Analytics';
import Approvals from './pages/Approvals';
import AuditExport from './pages/AuditExport';
import CICD from './pages/CICD';
import ComplianceDashboard from './pages/ComplianceDashboard';
import ConnectorBuilder from './pages/ConnectorBuilder';
import ConnectorMarketplace from './pages/ConnectorMarketplace';
import CostManagement from './pages/CostManagement';
import Dashboard from './pages/Dashboard';
import Documentation from './pages/Documentation';
import Governance from './pages/Governance';
import Home from './pages/Home';
import IntegrationManagement from './pages/IntegrationManagement';
import Integrations from './pages/Integrations';
import KnowledgeBase from './pages/KnowledgeBase';
import Monitoring from './pages/Monitoring';
import Observability from './pages/Observability';
import OrchestrationHub from './pages/OrchestrationHub';
// Lazy-loaded large pages for better performance (code splitting)
// Note: These are wrapped with Suspense in withSuspense(), which handles loading states
// The ErrorBoundary in App.jsx will catch any import failures from network issues
const RAGManagement = lazy(() => import('./pages/RAGManagement'));
const VisualWorkflowBuilder = lazy(() => import('./pages/VisualWorkflowBuilder'));
const ConnectorSubmission = lazy(() => import('./pages/ConnectorSubmission'));
const SkillDetail = lazy(() => import('./pages/SkillDetail'));
import RefactorPolicies from './pages/RefactorPolicies';
import Refactoring from './pages/Refactoring';
import RunDetail from './pages/RunDetail';
import Runs from './pages/Runs';
import SecurityTests from './pages/SecurityTests';
import Settings from './pages/Settings';
import SkillManagement from './pages/SkillManagement';
import SkillMarketplace from './pages/SkillMarketplace';
import TemplateCustomizer from './pages/TemplateCustomizer';
import Templates from './pages/Templates';
import ToolMarketplace from './pages/ToolMarketplace';
import UserProfile from './pages/UserProfile';
import Webhooks from './pages/Webhooks';
import WorkflowDetail from './pages/WorkflowDetail';
import WorkflowStudio from './pages/WorkflowStudio';
import Workflows from './pages/Workflows';
import agents from './pages/agents';
import __Layout from './Layout.jsx';

// Loading fallback component for lazy-loaded pages
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-400 text-sm">Loading page...</p>
    </div>
  </div>
);

// Wrapper for lazy-loaded pages with Suspense boundary
const withSuspense = (Component) => {
  return (props) => (
    <Suspense fallback={<PageLoader />}>
      <Component {...props} />
    </Suspense>
  );
};


export const PAGES = {
    "AdvancedOrchestration": AdvancedOrchestration,
    "AgentAnalytics": AgentAnalytics,
    "AgentCollaboration": AgentCollaboration,
    "AgentDebugger": AgentDebugger,
    "AgentDetail": AgentDetail,
    "AgentTraining": AgentTraining,
    "AgentWorkflowDesigner": AgentWorkflowDesigner,
    "Agents": Agents,
    "Analytics": Analytics,
    "Approvals": Approvals,
    "AuditExport": AuditExport,
    "CICD": CICD,
    "ComplianceDashboard": ComplianceDashboard,
    "ConnectorBuilder": ConnectorBuilder,
    "ConnectorMarketplace": ConnectorMarketplace,
    "CostManagement": CostManagement,
    "Dashboard": Dashboard,
    "Documentation": Documentation,
    "Governance": Governance,
    "Home": Home,
    "IntegrationManagement": IntegrationManagement,
    "Integrations": Integrations,
    "KnowledgeBase": KnowledgeBase,
    "Monitoring": Monitoring,
    "Observability": Observability,
    "OrchestrationHub": OrchestrationHub,
    // Lazy-loaded pages wrapped with Suspense for code splitting
    "RAGManagement": withSuspense(RAGManagement),
    "RefactorPolicies": RefactorPolicies,
    "Refactoring": Refactoring,
    "RunDetail": RunDetail,
    "Runs": Runs,
    "SecurityTests": SecurityTests,
    "Settings": Settings,
    "SkillDetail": withSuspense(SkillDetail),
    "SkillManagement": SkillManagement,
    "SkillMarketplace": SkillMarketplace,
    "TemplateCustomizer": TemplateCustomizer,
    "Templates": Templates,
    "ToolMarketplace": ToolMarketplace,
    "UserProfile": UserProfile,
    "VisualWorkflowBuilder": withSuspense(VisualWorkflowBuilder),
    "Webhooks": Webhooks,
    "WorkflowDetail": WorkflowDetail,
    "WorkflowStudio": WorkflowStudio,
    "Workflows": Workflows,
    "agents": agents,
    "ConnectorSubmission": withSuspense(ConnectorSubmission),
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};