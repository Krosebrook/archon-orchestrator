import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle, ChevronRight, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const eventIcons = {
  run_started: <Clock className="w-5 h-5 text-blue-400" />,
  task_completed: <CheckCircle className="w-5 h-5 text-green-400" />,
  task_failed: <XCircle className="w-5 h-5 text-red-400" />,
  log_message: <MessageSquare className="w-5 h-5 text-slate-400" />,
  run_finished: <CheckCircle className="w-5 h-5 text-green-400" />,
  run_failed: <XCircle className="w-5 h-5 text-red-400" />,
  default: <ChevronRight className="w-5 h-5 text-slate-500" />,
};

const eventColors = {
  run_started: 'border-blue-500/50',
  task_completed: 'border-green-500/50',
  task_failed: 'border-red-500/50',
  log_message: 'border-slate-600/50',
  run_finished: 'border-green-500/50',
  run_failed: 'border-red-500/50',
  default: 'border-slate-700',
};

export default function RunTimeline({ events }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader><CardTitle className="text-white">Event Timeline</CardTitle></CardHeader>
      <CardContent>
        <div className="relative pl-6">
          <div className="absolute left-[34px] top-0 h-full w-0.5 bg-slate-800" />
          <div className="space-y-8">
            {events.map((event) => (
              <div key={event.id} className="relative flex items-start">
                <div className={`absolute left-[-8px] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border-2 ${eventColors[event.type] || eventColors.default}`}>
                  <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center">
                    {eventIcons[event.type] || eventIcons.default}
                  </div>
                </div>
                <div className="ml-10">
                  <p className="font-medium text-white">{event.type.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-slate-400">{event.payload.message || JSON.stringify(event.payload)}</p>
                  <time className="text-xs text-slate-500">{format(new Date(event.created_date), 'MMM d, yyyy, h:mm:ss a')}</time>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}