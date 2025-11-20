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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};