
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Run, Agent, Workflow } from '@/entities/all';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Clock, Zap, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { subDays, format, startOfMonth, endOfMonth } from 'date-fns';
import AgentPerformanceAnalytics from '../components/analytics/AgentPerformanceAnalytics';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analytics & Performance</h1>
        <p className="text-slate-400">Comprehensive performance metrics and insights</p>
      </div>

      <AgentPerformanceAnalytics />
    </div>
  );
}
