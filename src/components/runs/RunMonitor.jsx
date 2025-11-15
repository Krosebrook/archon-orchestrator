import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import { X, CheckCircle2, Loader, AlertTriangle, Clock, PlayCircle } from 'lucide-react';

const statusIcons = {
  pending: { icon: Clock, color: 'text-slate-500' },
  running: { icon: Loader, color: 'text-blue-500 animate-spin' },
  completed: { icon: CheckCircle2, color: 'text-green-500' },
  failed: { icon: AlertTriangle, color: 'text-red-500' },
};

const StepItem = ({ step, isLast }) => {
  const { icon: Icon, color } = statusIcons[step.status];
  return (
    <div className="relative pl-8">
      {!isLast && <div className="absolute left-[15px] top-5 h-full w-px bg-slate-700" />}
      <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="pl-4 py-1">
        <p className="font-medium text-white">{step.label}</p>
        <p className="text-sm text-slate-400">Status: <span className="capitalize">{step.status}</span></p>
        {step.output && (
          <div className="mt-2 text-xs bg-slate-950 p-2 rounded-md border border-slate-700 text-slate-300 whitespace-pre-wrap">
            {step.output}
          </div>
        )}
      </div>
    </div>
  );
};

export default function RunMonitor({ isOpen, onClose, run }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-white">
                <PlayCircle className="w-5 h-5 text-blue-400" />
                Workflow Run
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-grow p-6 overflow-y-auto">
              {!run && (
                <div className="text-center text-slate-400">
                  <p>Click "Run" to start the workflow.</p>
                </div>
              )}
              {run && (
                <div className="space-y-6">
                  {run.steps.map((step, index) => (
                    <StepItem key={step.id} step={step} isLast={index === run.steps.length - 1} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}