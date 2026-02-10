/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdvancedOrchestration from './pages/AdvancedOrchestration';
import AdvancedTraining from './pages/AdvancedTraining';
import AgentAnalytics from './pages/AgentAnalytics';
import AgentCollaboration from './pages/AgentCollaboration';
import AgentDebugger from './pages/AgentDebugger';
import AgentDetail from './pages/AgentDetail';
import AgentTraining from './pages/AgentTraining';
import AgentWorkflowDesigner from './pages/AgentWorkflowDesigner';
import Analytics from './pages/Analytics';
import Approvals from './pages/Approvals';
import AuditExport from './pages/AuditExport';
import CICD from './pages/CICD';
import ComplianceDashboard from './pages/ComplianceDashboard';
import ConnectorBuilder from './pages/ConnectorBuilder';
import ConnectorMarketplace from './pages/ConnectorMarketplace';
import ConnectorSubmission from './pages/ConnectorSubmission';
import CostManagement from './pages/CostManagement';
import Dashboard from './pages/Dashboard';
import Documentation from './pages/Documentation';
import Governance from './pages/Governance';
import Home from './pages/Home';
import IntegrationManagement from './pages/IntegrationManagement';
import Integrations from './pages/Integrations';
import KnowledgeBase from './pages/KnowledgeBase';
import Monitoring from './pages/Monitoring';
import MyConnectorSubmissions from './pages/MyConnectorSubmissions';
import Observability from './pages/Observability';
import OrchestrationHub from './pages/OrchestrationHub';
import RAGManagement from './pages/RAGManagement';
import RefactorPolicies from './pages/RefactorPolicies';
import Refactoring from './pages/Refactoring';
import RunDetail from './pages/RunDetail';
import Runs from './pages/Runs';
import SecurityTests from './pages/SecurityTests';
import Settings from './pages/Settings';
import SkillDetail from './pages/SkillDetail';
import SkillManagement from './pages/SkillManagement';
import SkillMarketplace from './pages/SkillMarketplace';
import TemplateCustomizer from './pages/TemplateCustomizer';
import Templates from './pages/Templates';
import ToolMarketplace from './pages/ToolMarketplace';
import UserProfile from './pages/UserProfile';
import VisualWorkflowBuilder from './pages/VisualWorkflowBuilder';
import Webhooks from './pages/Webhooks';
import WorkflowDetail from './pages/WorkflowDetail';
import WorkflowStudio from './pages/WorkflowStudio';
import Workflows from './pages/Workflows';
import agents from './pages/agents';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdvancedOrchestration": AdvancedOrchestration,
    "AdvancedTraining": AdvancedTraining,
    "AgentAnalytics": AgentAnalytics,
    "AgentCollaboration": AgentCollaboration,
    "AgentDebugger": AgentDebugger,
    "AgentDetail": AgentDetail,
    "AgentTraining": AgentTraining,
    "AgentWorkflowDesigner": AgentWorkflowDesigner,
    "Analytics": Analytics,
    "Approvals": Approvals,
    "AuditExport": AuditExport,
    "CICD": CICD,
    "ComplianceDashboard": ComplianceDashboard,
    "ConnectorBuilder": ConnectorBuilder,
    "ConnectorMarketplace": ConnectorMarketplace,
    "ConnectorSubmission": ConnectorSubmission,
    "CostManagement": CostManagement,
    "Dashboard": Dashboard,
    "Documentation": Documentation,
    "Governance": Governance,
    "Home": Home,
    "IntegrationManagement": IntegrationManagement,
    "Integrations": Integrations,
    "KnowledgeBase": KnowledgeBase,
    "Monitoring": Monitoring,
    "MyConnectorSubmissions": MyConnectorSubmissions,
    "Observability": Observability,
    "OrchestrationHub": OrchestrationHub,
    "RAGManagement": RAGManagement,
    "RefactorPolicies": RefactorPolicies,
    "Refactoring": Refactoring,
    "RunDetail": RunDetail,
    "Runs": Runs,
    "SecurityTests": SecurityTests,
    "Settings": Settings,
    "SkillDetail": SkillDetail,
    "SkillManagement": SkillManagement,
    "SkillMarketplace": SkillMarketplace,
    "TemplateCustomizer": TemplateCustomizer,
    "Templates": Templates,
    "ToolMarketplace": ToolMarketplace,
    "UserProfile": UserProfile,
    "VisualWorkflowBuilder": VisualWorkflowBuilder,
    "Webhooks": Webhooks,
    "WorkflowDetail": WorkflowDetail,
    "WorkflowStudio": WorkflowStudio,
    "Workflows": Workflows,
    "agents": agents,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};