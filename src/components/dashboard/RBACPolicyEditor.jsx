import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Shield, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { Roles, Permissions, getRoleDisplayName, getRoleDescription } from '../shared/constants/rbac';

// ---------------------------------------------------------------------------
// Zod-style inline validation (no external dep required)
// ---------------------------------------------------------------------------
const VALID_ROLES = Object.values(Roles);

function validatePolicy(parsed) {
  const errors = [];
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return [{ path: '$', message: 'Policy must be a JSON object' }];
  }
  if (!parsed.version || typeof parsed.version !== 'string') {
    errors.push({ path: '$.version', message: 'version (string) is required' });
  }
  if (!Array.isArray(parsed.roles)) {
    errors.push({ path: '$.roles', message: 'roles must be an array' });
  } else {
    parsed.roles.forEach((r, i) => {
      if (!r.id) errors.push({ path: `$.roles[${i}].id`, message: 'id is required' });
      if (!r.name) errors.push({ path: `$.roles[${i}].name`, message: 'name is required' });
      if (!Array.isArray(r.permissions)) {
        errors.push({ path: `$.roles[${i}].permissions`, message: 'permissions must be an array' });
      } else {
        r.permissions.forEach((p, pi) => {
          if (typeof p !== 'string') {
            errors.push({ path: `$.roles[${i}].permissions[${pi}]`, message: 'must be a string' });
          } else if (!Permissions[p]) {
            errors.push({ path: `$.roles[${i}].permissions[${pi}]`, message: `unknown permission: ${p}` });
          }
        });
      }
    });
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Example templates
// ---------------------------------------------------------------------------
const EXAMPLES = {
  default: {
    version: '1.0.0',
    org_id: 'org_example',
    roles: [
      { id: 'owner', name: 'Owner', permissions: Object.keys(Permissions) },
      { id: 'admin', name: 'Administrator', permissions: Object.entries(Permissions).filter(([, v]) => v.includes('admin')).map(([k]) => k) },
      { id: 'operator', name: 'Operator', permissions: Object.entries(Permissions).filter(([, v]) => v.includes('operator')).map(([k]) => k) },
      { id: 'viewer', name: 'Viewer', permissions: Object.entries(Permissions).filter(([, v]) => v.includes('viewer')).map(([k]) => k) },
    ],
  },
  minimal: {
    version: '1.0.0',
    org_id: 'org_minimal',
    roles: [
      { id: 'admin', name: 'Administrator', permissions: ['agent.create', 'agent.view', 'agent.edit', 'workflow.create', 'workflow.edit', 'workflow.run'] },
      { id: 'viewer', name: 'Viewer', permissions: ['agent.view', 'workflow.view'] },
    ],
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function PermissionMatrix({ policy }) {
  const [expanded, setExpanded] = useState({});
  const namespaces = [...new Set(Object.keys(Permissions).map(p => p.split('.')[0]))];

  return (
    <div className="space-y-1">
      {namespaces.map(ns => {
        const nsPerms = Object.keys(Permissions).filter(p => p.startsWith(ns + '.'));
        const isOpen = expanded[ns];
        return (
          <div key={ns} className="rounded-lg border border-slate-700 overflow-hidden">
            <button
              onClick={() => setExpanded(prev => ({ ...prev, [ns]: !prev[ns] }))}
              className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-left"
            >
              {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              <span className="text-sm font-medium text-slate-200 capitalize">{ns}</span>
              <span className="ml-auto text-xs text-slate-500">{nsPerms.length} permissions</span>
            </button>
            {isOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="text-left px-3 py-2 text-slate-400 font-medium">Permission</th>
                      {policy.roles.map(r => (
                        <th key={r.id} className="px-3 py-2 text-slate-400 font-medium text-center">{r.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nsPerms.map(perm => (
                      <tr key={perm} className="border-t border-slate-800">
                        <td className="px-3 py-2 text-slate-300 font-mono">{perm}</td>
                        {policy.roles.map(r => {
                          const granted = Array.isArray(r.permissions) && r.permissions.includes(perm);
                          return (
                            <td key={r.id} className="px-3 py-2 text-center">
                              {granted
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                                : <XCircle className="w-4 h-4 text-slate-700 mx-auto" />}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function RBACPolicyEditor() {
  const [raw, setRaw] = useState(JSON.stringify(EXAMPLES.default, null, 2));
  const [errors, setErrors] = useState([]);
  const [saved, setSaved] = useState(false);
  const [parsed, setParsed] = useState(EXAMPLES.default);

  const validate = useCallback((text) => {
    try {
      const obj = JSON.parse(text);
      const errs = validatePolicy(obj);
      setErrors(errs);
      if (errs.length === 0) setParsed(obj);
      return errs;
    } catch (e) {
      setErrors([{ path: '$', message: `JSON parse error: ${e.message}` }]);
      return [{ path: '$', message: e.message }];
    }
  }, []);

  const handleChange = (val) => {
    setRaw(val);
    setSaved(false);
    validate(val);
  };

  const handleSave = () => {
    const errs = validate(raw);
    if (errs.length === 0) setSaved(true);
  };

  const loadExample = (key) => {
    const text = JSON.stringify(EXAMPLES[key], null, 2);
    setRaw(text);
    setErrors([]);
    setParsed(EXAMPLES[key]);
    setSaved(false);
  };

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-400" />
          <div>
            <CardTitle className="text-white">RBAC Policy Editor</CardTitle>
            <CardDescription className="text-slate-400">Edit and validate role-based access control policies as JSON</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">Load example:</span>
          <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700" onClick={() => loadExample('default')}>Default (4 roles)</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700" onClick={() => loadExample('minimal')}>Minimal (2 roles)</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto text-slate-400" onClick={() => { setRaw(''); setErrors([]); setParsed(null); }}>
            <RotateCcw className="w-3 h-3 mr-1" /> Clear
          </Button>
        </div>

        <Tabs defaultValue="editor">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="editor" className="text-xs">JSON Editor</TabsTrigger>
            <TabsTrigger value="matrix" className="text-xs" disabled={!parsed}>Permission Matrix</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-3 mt-3">
            <Textarea
              value={raw}
              onChange={e => handleChange(e.target.value)}
              className="font-mono text-xs bg-slate-950 border-slate-700 text-slate-200 min-h-[320px] resize-y"
              spellCheck={false}
              placeholder="Paste your RBAC policy JSON here..."
            />

            {errors.length > 0 && (
              <div className="space-y-1">
                {errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded px-3 py-2">
                    <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span><code className="text-red-300">{e.path}</code> — {e.message}</span>
                  </div>
                ))}
              </div>
            )}

            {errors.length === 0 && raw.trim() && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 rounded px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Policy is valid — {parsed?.roles?.length ?? 0} roles, {parsed?.roles?.reduce((a, r) => a + (r.permissions?.length || 0), 0)} total permission assignments
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={errors.length > 0} className="bg-blue-600 hover:bg-blue-700 text-white">
                Save Policy
              </Button>
              {saved && <Badge className="bg-emerald-600 text-white self-center">Saved</Badge>}
            </div>
          </TabsContent>

          <TabsContent value="matrix" className="mt-3">
            {parsed && <PermissionMatrix policy={parsed} />}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}