import { useState, useEffect, useRef } from 'react';
import { Event } from '@/entities/Event';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';

const eventIcons = {
  task_start: <CheckCircle className="w-4 h-4 text-blue-400" />,
  log: <Info className="w-4 h-4 text-slate-400" />,
  api_call: <Terminal className="w-4 h-4 text-purple-400" />,
  task_end: <CheckCircle className="w-4 h-4 text-green-400" />,
  error: <AlertCircle className="w-4 h-4 text-red-400" />,
};

const mockNewLogs = [
  { id: 'evt_mock_1', type: 'log', payload: { message: 'Processing final output...' } },
  { id: 'evt_mock_2', type: 'api_call', payload: { service: 'sendgrid', message: 'Sending summary email.' } },
  { id: 'evt_mock_3', type: 'task_end', payload: { task_name: 'Summarize', message: 'Workflow finished successfully.' } },
];

export default function LiveLogStream({ runId, runStatus }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const data = await Event.filter({ run_id: runId }, 'created_date');
        setEvents(data);
      } catch (error) {
        console.error("Failed to load events:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (runId) {
      loadEvents();
    }
  }, [runId]);

  useEffect(() => {
    if (runStatus === 'running') {
      let logIndex = 0;
      const interval = setInterval(() => {
        if (logIndex < mockNewLogs.length) {
          const newLog = { ...mockNewLogs[logIndex], created_date: new Date().toISOString() };
          setEvents(prev => [...prev, newLog]);
          logIndex++;
        } else {
          clearInterval(interval);
        }
      }, 2500); // Add a new log every 2.5 seconds

      return () => clearInterval(interval);
    }
  }, [runStatus]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div ref={scrollRef} className="h-[500px] bg-slate-950 rounded-lg p-4 font-mono text-sm overflow-y-auto border border-slate-800">
      <AnimatePresence>
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            className="flex items-start gap-4 mb-2"
          >
            <div className="text-slate-600">{format(new Date(event.created_date), 'HH:mm:ss')}</div>
            <div className="flex-shrink-0">{eventIcons[event.type] || <Info className="w-4 h-4" />}</div>
            <div className="text-slate-300 whitespace-pre-wrap flex-1">
              {event.payload.message}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {runStatus === 'running' && (
        <div className="flex items-center gap-2 text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Listening for new events...</span>
        </div>
      )}
    </div>
  );
}