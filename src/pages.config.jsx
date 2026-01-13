import { lazy, Suspense } from 'react';
// Keep frequently accessed pages as eager imports for better initial UX
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Agents from './pages/Agents';
import __Layout from './Layout.jsx';

// Lazy-loaded pages for better performance (code splitting)
// Note: These are wrapped with Suspense in withSuspense(), which handles loading states
// The ErrorBoundary in App.jsx will catch any import failures from network issues

// Analytics & Reporting (heavy data visualization)
const Analytics = lazy(() => import('./pages/Analytics'));
const AgentAnalytics = lazy(() => import('./pages/AgentAnalytics'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const Observability = lazy(() => import('./pages/Observability'));
const CostManagement = lazy(() => import('./pages/CostManagement'));

// Workflow & Orchestration (complex builders/editors)
const VisualWorkflowBuilder = lazy(() => import('./pages/VisualWorkflowBuilder'));
const WorkflowStudio = lazy(() => import('./pages/WorkflowStudio'));
const Workflows = lazy(() => import('./pages/Workflows'));
const WorkflowDetail = lazy(() => import('./pages/WorkflowDetail'));
const AgentWorkflowDesigner = lazy(() => import('./pages/AgentWorkflowDesigner'));
const AdvancedOrchestration = lazy(() => import('./pages/AdvancedOrchestration'));
const OrchestrationHub = lazy(() => import('./pages/OrchestrationHub'));

// Agent Management (detail pages)
const AgentDetail = lazy(() => import('./pages/AgentDetail'));
const AgentTraining = lazy(() => import('./pages/AgentTraining'));
const AgentCollaboration = lazy(() => import('./pages/AgentCollaboration'));
const AgentDebugger = lazy(() => import('./pages/AgentDebugger'));
const agents = lazy(() => import('./pages/agents'));

// Connectors & Integrations
const ConnectorBuilder = lazy(() => import('./pages/ConnectorBuilder'));
const ConnectorMarketplace = lazy(() => import('./pages/ConnectorMarketplace'));
const ConnectorSubmission = lazy(() => import('./pages/ConnectorSubmission'));
const Integrations = lazy(() => import('./pages/Integrations'));
const IntegrationManagement = lazy(() => import('./pages/IntegrationManagement'));

// Skills & Templates
const SkillDetail = lazy(() => import('./pages/SkillDetail'));
const SkillManagement = lazy(() => import('./pages/SkillManagement'));
const SkillMarketplace = lazy(() => import('./pages/SkillMarketplace'));
const Templates = lazy(() => import('./pages/Templates'));
const TemplateCustomizer = lazy(() => import('./pages/TemplateCustomizer'));
const ToolMarketplace = lazy(() => import('./pages/ToolMarketplace'));

// Administration & Governance
const Governance = lazy(() => import('./pages/Governance'));
const ComplianceDashboard = lazy(() => import('./pages/ComplianceDashboard'));
const SecurityTests = lazy(() => import('./pages/SecurityTests'));
const AuditExport = lazy(() => import('./pages/AuditExport'));
const Approvals = lazy(() => import('./pages/Approvals'));

// Development & DevOps
const CICD = lazy(() => import('./pages/CICD'));
const Refactoring = lazy(() => import('./pages/Refactoring'));
const RefactorPolicies = lazy(() => import('./pages/RefactorPolicies'));

// Knowledge & Documentation
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const RAGManagement = lazy(() => import('./pages/RAGManagement'));
const Documentation = lazy(() => import('./pages/Documentation'));

// Workflow Execution
const Runs = lazy(() => import('./pages/Runs'));
const RunDetail = lazy(() => import('./pages/RunDetail'));

// User & Settings
const Settings = lazy(() => import('./pages/Settings'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Webhooks = lazy(() => import('./pages/Webhooks'));

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
    // Eager-loaded pages (frequently accessed, needed for initial UX)
    "Dashboard": Dashboard,
    "Home": Home,
    "Agents": Agents,
    
    // Lazy-loaded pages wrapped with Suspense for code splitting and better performance
    // Analytics & Reporting
    "Analytics": withSuspense(Analytics),
    "AgentAnalytics": withSuspense(AgentAnalytics),
    "Monitoring": withSuspense(Monitoring),
    "Observability": withSuspense(Observability),
    "CostManagement": withSuspense(CostManagement),
    
    // Workflow & Orchestration
    "VisualWorkflowBuilder": withSuspense(VisualWorkflowBuilder),
    "WorkflowStudio": withSuspense(WorkflowStudio),
    "Workflows": withSuspense(Workflows),
    "WorkflowDetail": withSuspense(WorkflowDetail),
    "AgentWorkflowDesigner": withSuspense(AgentWorkflowDesigner),
    "AdvancedOrchestration": withSuspense(AdvancedOrchestration),
    "OrchestrationHub": withSuspense(OrchestrationHub),
    
    // Agent Management
    "AgentDetail": withSuspense(AgentDetail),
    "AgentTraining": withSuspense(AgentTraining),
    "AgentCollaboration": withSuspense(AgentCollaboration),
    "AgentDebugger": withSuspense(AgentDebugger),
    "agents": withSuspense(agents),
    
    // Connectors & Integrations
    "ConnectorBuilder": withSuspense(ConnectorBuilder),
    "ConnectorMarketplace": withSuspense(ConnectorMarketplace),
    "ConnectorSubmission": withSuspense(ConnectorSubmission),
    "Integrations": withSuspense(Integrations),
    "IntegrationManagement": withSuspense(IntegrationManagement),
    
    // Skills & Templates
    "SkillDetail": withSuspense(SkillDetail),
    "SkillManagement": withSuspense(SkillManagement),
    "SkillMarketplace": withSuspense(SkillMarketplace),
    "Templates": withSuspense(Templates),
    "TemplateCustomizer": withSuspense(TemplateCustomizer),
    "ToolMarketplace": withSuspense(ToolMarketplace),
    
    // Administration & Governance
    "Governance": withSuspense(Governance),
    "ComplianceDashboard": withSuspense(ComplianceDashboard),
    "SecurityTests": withSuspense(SecurityTests),
    "AuditExport": withSuspense(AuditExport),
    "Approvals": withSuspense(Approvals),
    
    // Development & DevOps
    "CICD": withSuspense(CICD),
    "Refactoring": withSuspense(Refactoring),
    "RefactorPolicies": withSuspense(RefactorPolicies),
    
    // Knowledge & Documentation
    "KnowledgeBase": withSuspense(KnowledgeBase),
    "RAGManagement": withSuspense(RAGManagement),
    "Documentation": withSuspense(Documentation),
    
    // Workflow Execution
    "Runs": withSuspense(Runs),
    "RunDetail": withSuspense(RunDetail),
    
    // User & Settings
    "Settings": withSuspense(Settings),
    "UserProfile": withSuspense(UserProfile),
    "Webhooks": withSuspense(Webhooks),
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};