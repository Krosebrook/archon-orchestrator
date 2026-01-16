
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Policy, Audit, Alert } from '@/entities/all'; // Added Alert import
import PoliciesTable from '../components/governance/PoliciesTable';
import AuditsTable from '../components/governance/AuditsTable';
import AlertsTable from '../components/governance/AlertsTable'; // Added AlertsTable import
import PolicyForm from '../components/governance/PolicyForm';

export default function Governance() {
    const [policies, setPolicies] = useState([]);
    const [audits, setAudits] = useState([]);
    const [alerts, setAlerts] = useState([]); // New state for alerts
    const [_isLoading, _setIsLoading] = useState(true);
    const [isPolicyFormOpen, setIsPolicyFormOpen] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [policyData, auditData, alertData] = await Promise.all([ // Added alertData to Promise.all
                Policy.list(),
                Audit.list('-created_date', 50),
                Alert.list('-created_date', 50) // Fetch alerts
            ]);
            setPolicies(policyData);
            setAudits(auditData);
            setAlerts(alertData); // Set alerts
        } catch (error) {
            console.error("Failed to load governance data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreatePolicy = () => {
        setSelectedPolicy(null);
        setIsPolicyFormOpen(true);
    };

    const handleEditPolicy = (policy) => {
        setSelectedPolicy(policy);
        setIsPolicyFormOpen(true);
    };

    const handlePolicySave = () => {
        setIsPolicyFormOpen(false);
        loadData();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Governance Center</h1>
                    <p className="text-slate-400">Manage security, enforce policies, and review audit trails.</p>
                </div>
                <Button onClick={handleCreatePolicy} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    New Policy
                </Button>
            </div>
            
            <Tabs defaultValue="policies" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-slate-800 text-slate-400"> {/* Changed grid-cols-3 to grid-cols-4 */}
                    <TabsTrigger value="policies" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Policies ({policies.length})
                    </TabsTrigger>
                    <TabsTrigger value="audits" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Audit Trail ({audits.length})
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"> {/* New tab trigger for Alerts */}
                        Alerts ({alerts.length})
                    </TabsTrigger>
                    <TabsTrigger value="ab-testing" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"> {/* New tab trigger for A/B Testing */}
                        A/B Testing
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="policies" className="mt-6">
                    <PoliciesTable policies={policies} onEdit={handleEditPolicy} onToggle={loadData} />
                </TabsContent>
                <TabsContent value="audits" className="mt-6">
                    <AuditsTable audits={audits} />
                </TabsContent>
                <TabsContent value="alerts" className="mt-6"> {/* New tab content for Alerts */}
                    <AlertsTable alerts={alerts} />
                </TabsContent>
                <TabsContent value="ab-testing" className="mt-6"> {/* New tab content for A/B Testing */}
                    <div className="p-4 text-white">
                        <h3 className="text-xl font-semibold mb-2">A/B Testing Module</h3>
                        <p>This module is currently under development. Please check back later for updates.</p>
                    </div>
                </TabsContent>
            </Tabs>

            <PolicyForm
                open={isPolicyFormOpen}
                onOpenChange={setIsPolicyFormOpen}
                policy={selectedPolicy}
                onSave={handlePolicySave}
            />
        </div>
    );
}
