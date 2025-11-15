import { Toaster } from 'sonner';

export default function ToastProvider() {
  return (
    <Toaster 
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'bg-slate-800 border-slate-700 text-white',
          title: 'text-white',
          description: 'text-slate-400',
          actionButton: 'bg-blue-600',
          cancelButton: 'bg-slate-700',
        },
      }}
    />
  );
}