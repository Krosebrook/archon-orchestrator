import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Workflows from './pages/Workflows';
import Runs from './pages/Runs';
import Governance from './pages/Governance';
import Settings from './pages/Settings';
import WorkflowDetail from './pages/WorkflowDetail';
import RunDetail from './pages/RunDetail';
import Analytics from './pages/Analytics';
import Approvals from './pages/Approvals';
import Integrations from './pages/Integrations';
import AgentDetail from './pages/AgentDetail';
import agents from './pages/agents';
import UserProfile from './pages/UserProfile';
import Templates from './pages/Templates';
import Refactoring from './pages/Refactoring';
import Monitoring from './pages/Monitoring';
import OrchestrationHub from './pages/OrchestrationHub';
import Observability from './pages/Observability';
import RefactorPolicies from './pages/RefactorPolicies';
import WorkflowStudio from './pages/WorkflowStudio';
import ToolMarketplace from './pages/ToolMarketplace';
import TemplateCustomizer from './pages/TemplateCustomizer';
import IntegrationManagement from './pages/IntegrationManagement';
import SkillMarketplace from './pages/SkillMarketplace';
import SkillDetail from './pages/SkillDetail';
import AgentAnalytics from './pages/AgentAnalytics';
import AgentWorkflowDesigner from './pages/AgentWorkflowDesigner';
import CICD from './pages/CICD';
import SkillManagement from './pages/SkillManagement';
import AgentCollaboration from './pages/AgentCollaboration';
import AgentDebugger from './pages/AgentDebugger';
import AgentTraining from './pages/AgentTraining';
import VisualWorkflowBuilder from './pages/VisualWorkflowBuilder';
import Documentation from './pages/Documentation';
import AuditExport from './pages/AuditExport';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Agents": Agents,
    "Workflows": Workflows,
    "Runs": Runs,
    "Governance": Governance,
    "Settings": Settings,
    "WorkflowDetail": WorkflowDetail,
    "RunDetail": RunDetail,
    "Analytics": Analytics,
    "Approvals": Approvals,
    "Integrations": Integrations,
    "AgentDetail": AgentDetail,
    "agents": agents,
    "UserProfile": UserProfile,
    "Templates": Templates,
    "Refactoring": Refactoring,
    "Monitoring": Monitoring,
    "OrchestrationHub": OrchestrationHub,
    "Observability": Observability,
    "RefactorPolicies": RefactorPolicies,
    "WorkflowStudio": WorkflowStudio,
    "ToolMarketplace": ToolMarketplace,
    "TemplateCustomizer": TemplateCustomizer,
    "IntegrationManagement": IntegrationManagement,
    "SkillMarketplace": SkillMarketplace,
    "SkillDetail": SkillDetail,
    "AgentAnalytics": AgentAnalytics,
    "AgentWorkflowDesigner": AgentWorkflowDesigner,
    "CICD": CICD,
    "SkillManagement": SkillManagement,
    "AgentCollaboration": AgentCollaboration,
    "AgentDebugger": AgentDebugger,
    "AgentTraining": AgentTraining,
    "VisualWorkflowBuilder": VisualWorkflowBuilder,
    "Documentation": Documentation,
    "AuditExport": AuditExport,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};