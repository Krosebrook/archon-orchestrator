import AdvancedOrchestration from './pages/AdvancedOrchestration';
import AgentAnalytics from './pages/AgentAnalytics';
import AgentCollaboration from './pages/AgentCollaboration';
import AgentDebugger from './pages/AgentDebugger';
import AgentDetail from './pages/AgentDetail';
import AgentTraining from './pages/AgentTraining';
import AgentWorkflowDesigner from './pages/AgentWorkflowDesigner';
import Agents from './pages/agents';
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

import MyConnectorSubmissions from './pages/MyConnectorSubmissions';
import __Layout from './Layout.jsx';


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
    "MyConnectorSubmissions": MyConnectorSubmissions,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};