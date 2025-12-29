import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard,
  Bot,
  GitFork,
  PlaySquare,
  Shield,
  Settings,
  Sun,
  Moon,
  ChevronsLeft,
  ChevronsRight,
  User,
  LogOut,
  Search,
  BarChart3,
  CheckSquare,
  Zap,
  Users,
  Crown,
  Wrench,
  Eye,
  Menu,
  Bell,
  Store,
  FileText,
  Brain,
  Sparkles,
  Bug,
  GraduationCap,
  Activity,
  Database,
  DollarSign,
  Plug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CommandPalette } from './components/shared/CommandPalette';
import NotificationCenter from './components/shared/NotificationCenter';
import { AnimatePresence, motion } from 'framer-motion';
import { RBACGuard } from './components/shared/RBACGuard';
import { AuthProvider, useAuth } from './components/contexts/AuthContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import ToastProvider from './components/providers/ToastProvider';
import PWAInstaller from './components/shared/PWAInstaller';
import { KeyboardShortcuts } from './components/shared/KeyboardShortcuts';
import { OnboardingTour } from './components/onboarding/OnboardingTour';
import { useOnboarding } from './components/hooks/useOnboarding';
import { HelpCircle } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard', permission: null, dataTour: 'dashboard-link' },
  { name: 'Orchestration', icon: Bot, path: 'OrchestrationHub', permission: 'agent.view' },
  { name: 'Advanced Orchestration', icon: Activity, path: 'AdvancedOrchestration', permission: 'agent.view' },
  { name: 'Workflow Builder', icon: Zap, path: 'VisualWorkflowBuilder', permission: 'workflow.edit' },
  { name: 'Workflow Studio', icon: Zap, path: 'WorkflowStudio', permission: 'workflow.edit' },
  { name: 'Templates', icon: FileText, path: 'Templates', permission: 'workflow.view', dataTour: 'templates-link' },
  { name: 'Agents', icon: Bot, path: 'Agents', permission: 'agent.view' },
  { name: 'Agent Workflows', icon: GitFork, path: 'AgentWorkflowDesigner', permission: 'agent.view' },
  { name: 'Collaboration', icon: Users, path: 'AgentCollaboration', permission: 'agent.view' },
  { name: 'Workflows', icon: GitFork, path: 'Workflows', permission: 'workflow.view', dataTour: 'workflows-link' },
  { name: 'CI/CD', icon: GitFork, path: 'CICD', permission: 'workflow.edit' },
  { name: 'Runs', icon: PlaySquare, path: 'Runs', permission: 'workflow.view', dataTour: 'runs-link' },
  { name: 'Analytics', icon: BarChart3, path: 'Analytics', permission: 'workflow.view' },
  { name: 'Agent Analytics', icon: Brain, path: 'AgentAnalytics', permission: 'workflow.view' },
  { name: 'Cost Management', icon: DollarSign, path: 'CostManagement', permission: 'workflow.view' },
  { name: 'Observability', icon: Eye, path: 'Observability', permission: 'workflow.view' },
  { name: 'Monitoring', icon: Eye, path: 'Monitoring', permission: 'workflow.view' },
  { name: 'Approvals', icon: CheckSquare, path: 'Approvals', permission: 'workflow.run' },
  { name: 'Tool Marketplace', icon: Store, path: 'ToolMarketplace', permission: 'workflow.view' },
  { name: 'Connectors', icon: Plug, path: 'ConnectorMarketplace', permission: 'workflow.view' },
  { name: 'Skill Marketplace', icon: Zap, path: 'SkillMarketplace', permission: 'workflow.view' },
  { name: 'Skill Management', icon: Sparkles, path: 'SkillManagement', permission: 'workflow.view' },
  { name: 'Integrations', icon: Settings, path: 'IntegrationManagement', permission: 'workflow.edit' },
  { name: 'Webhooks', icon: Zap, path: 'Webhooks', permission: 'workflow.edit' },
  { name: 'Governance', icon: Shield, path: 'Governance', permission: 'policy.view' },
  { name: 'Compliance', icon: Shield, path: 'ComplianceDashboard', permission: 'audit.view' },
  { name: 'Refactoring', icon: Wrench, path: 'Refactoring', permission: 'workflow.edit' },
  { name: 'Policies', icon: Shield, path: 'RefactorPolicies', permission: 'policy.view' },
  { name: 'AI Debugger', icon: Bug, path: 'AgentDebugger', permission: 'workflow.edit' },
  { name: 'Agent Training', icon: GraduationCap, path: 'AgentTraining', permission: 'agent.view' },
  { name: 'RAG & Knowledge', icon: Database, path: 'RAGManagement', permission: 'workflow.view' },
  { name: 'Security Tests', icon: Shield, path: 'SecurityTests', permission: 'audit.view' },
  { name: 'Audit Export', icon: FileText, path: 'AuditExport', permission: 'audit.export' },
  { name: 'Documentation', icon: FileText, path: 'Documentation', permission: null },
  { name: 'Knowledge Base', icon: FileText, path: 'KnowledgeBase', permission: null },
  ];

const Sidebar = ({ isCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();
  const { role: userRole } = useAuth();
  const sidebarRef = useRef(null);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsMobileOpen(false);
      }
    };

    if (isMobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileOpen, setIsMobileOpen]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, setIsMobileOpen]);

  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        ref={sidebarRef}
        className="fixed lg:relative top-0 left-0 h-full bg-slate-900 text-slate-200 flex flex-col z-50 lg:translate-x-0 transition-all duration-300"
        initial={false}
        animate={{
          x: isMobileOpen ? 0 : '-100%',
          width: isCollapsed ? '5rem' : '16rem'
        }}
      >
        <div className={`flex items-center border-b border-slate-800 ${isCollapsed ? 'justify-center h-20' : 'px-6 h-20'}`}>
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && <span className="text-xl font-semibold">Archon</span>}
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <RBACGuard key={item.name} permission={item.permission} userRole={userRole} showLockMessage={false}>
              <Link
                to={createPageUrl(item.path)}
                className={`
                  flex items-center rounded-lg text-sm font-medium transition-all duration-200
                  ${isCollapsed ? 'justify-center h-12 w-12 mx-auto' : 'gap-4 px-4 py-3'}
                  ${
                    location.pathname.includes(item.path)
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }
                `}
                title={isCollapsed ? item.name : ''}
                data-tour={item.dataTour}
                >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
                </Link>
            </RBACGuard>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <Link
            to={createPageUrl('Settings')}
            className={`
              flex items-center rounded-lg text-sm font-medium transition-all duration-200
              ${isCollapsed ? 'justify-center h-12 w-12 mx-auto' : 'gap-4 px-4 py-3'}
              ${
                location.pathname.includes('Settings')
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }
            `}
            title={isCollapsed ? 'Settings' : ''}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </Link>
        </div>
      </motion.aside>
    </>
  );
};

const Header = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, restartTour }) => {
  const { user, organization, role } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="flex items-center justify-between bg-slate-900/95 backdrop-blur-sm text-white h-20 px-4 lg:px-8 border-b border-slate-800 z-30">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(prev => !prev)}
          className="text-slate-400 hover:text-white hover:bg-slate-800 hidden lg:flex"
        >
          {isCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
        </Button>
        
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search everything..."
            className="bg-slate-800 border-slate-700 pl-9 w-64 text-sm focus:w-80 transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <NotificationCenter />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={restartTour}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
          data-tour="help-button"
          title="Help & Knowledge Base"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-400 hover:text-white hover:bg-slate-800">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        
        <DropdownMenu open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 hover:bg-slate-800 px-3">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-300" />
              </div>
              <div className="text-left hidden md:block">
                <p className="font-medium text-sm">{user?.fullName || 'User'}</p>
                <p className="text-xs text-slate-400 capitalize">{role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <Link to={createPageUrl('UserProfile')} onClick={() => setUserDropdownOpen(false)}>
              <DropdownMenuItem className="focus:bg-slate-800 focus:text-white">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
            </Link>
            <Link to={createPageUrl('Settings')} onClick={() => setUserDropdownOpen(false)}>
              <DropdownMenuItem className="focus:bg-slate-800 focus:text-white">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem className="focus:bg-slate-800 focus:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

function AppLayout({ children, currentPageName }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { showTour, completeTour, skipTour, restartTour } = useOnboarding();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .catch((error) => console.log('SW registration failed:', error));
    }
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <ToastProvider />
      <PWAInstaller />
      <KeyboardShortcuts />
      <CommandPalette />
      {showTour && <OnboardingTour onComplete={completeTour} onSkip={skipTour} />}
      <Sidebar 
        isCollapsed={isCollapsed} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen}
      />
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <Header 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          restartTour={restartTour}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 text-white">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="h-full w-full"
              >
                <RBACGuard permission={navItems.find(item => item.path === currentPageName)?.permission}>
                  {children}
                </RBACGuard>
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <AuthProvider>
      <AppLayout currentPageName={currentPageName}>{children}</AppLayout>
    </AuthProvider>
  );
}