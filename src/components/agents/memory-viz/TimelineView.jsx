import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

export default function TimelineView({ memories }) {
  const timelineGroups = memories.reduce((acc, memory) => {
    const date = format(parseISO(memory.created_date), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(memory);
    return acc;
  }, {});

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {Object.entries(timelineGroups)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, dayMemories]) => (
          <div key={date} className="relative pl-8 pb-4">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-800"></div>
            <div className="absolute left-[-4px] top-2 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
            
            <div className="mb-2">
              <span className="text-sm font-medium text-white">
                {format(parseISO(date), 'MMM d, yyyy')}
              </span>
            </div>
            
            <div className="space-y-2">
              {dayMemories.map((memory) => (
                <div
                  key={memory.id}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge
                      variant="outline"
                      className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs"
                    >
                      {memory.memory_type}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {format(parseISO(memory.created_date), 'h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{memory.content?.text}</p>
                  {memory.tags && memory.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {memory.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}