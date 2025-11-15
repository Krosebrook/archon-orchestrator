
import { useState, useEffect } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { LayoutDashboard, Bot, GitFork, PlaySquare, Shield, Settings, PlusCircle } from 'lucide-react'; // Added PlusCircle
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const pages = [
  { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard' },
  { name: 'Agents', icon: Bot, path: 'Agents' },
  { name: 'Workflows', icon: GitFork, path: 'Workflows' },
  { name: 'Runs', icon: PlaySquare, path: 'Runs' },
  { name: 'Governance', icon: Shield, path: 'Governance' },
  { name: 'Settings', icon: Settings, path: 'Settings' },
];

const createActions = [
  { name: 'New Agent', icon: PlusCircle, path: 'Agents/new' },
  { name: 'New Workflow', icon: PlusCircle, path: 'Workflows/new' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {pages.map((page) => (
            <CommandItem key={page.path} onSelect={() => runCommand(() => navigate(createPageUrl(page.path)))}>
              <page.icon className="mr-2 h-4 w-4" />
              <span>{page.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Create">
          {createActions.map((action) => (
            <CommandItem key={action.path} onSelect={() => runCommand(() => navigate(createPageUrl(action.path)))}>
              <action.icon className="mr-2 h-4 w-4" />
              <span>{action.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          {/* Add actions here in the future */}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
