/**
 * @fileoverview Date Picker with Range
 * @description Date range picker component for filtering
 * @version 1.0.0
 */

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function DatePickerWithRange({ date, onDateChange, className }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, 'MMM dd, yyyy')} - {format(date.to, 'MMM dd, yyyy')}
              </>
            ) : (
              format(date.from, 'MMM dd, yyyy')
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={(range) => {
            if (range) {
              onDateChange(range);
              if (range.from && range.to) {
                setIsOpen(false);
              }
            }
          }}
          numberOfMonths={2}
          className="text-white"
        />
      </PopoverContent>
    </Popover>
  );
}