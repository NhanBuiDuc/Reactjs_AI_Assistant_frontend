// src/components/TaskCalendarApp.tsx

import { useState } from 'react';
import { addDays } from 'date-fns';
import { Calendar, CalendarEvent } from '@/components/Calendar';
import { CalendarSidebar } from '@/components/CalendarSidebar';
import { EventDialog } from '@/components/EventDialog';

const sampleEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Meeting',
    date: new Date(),
    time: '10:00',
  },
  {
    id: '2',
    title: 'Project Review',
    date: addDays(new Date(), 1),
    time: '14:00',
  },
  {
    id: '3',
    title: 'Client Call',
    date: addDays(new Date(), 3),
    time: '16:30',
  },
  {
    id: '4',
    title: 'Design Workshop',
    date: addDays(new Date(), 5),
    time: '09:00',
  },
];

const TaskCalendarApp = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsEventDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(event.date);
    setIsEventDialogOpen(true);
  };

  const handleCreateEvent = () => {
    setSelectedDate(new Date());
    setSelectedEvent(null);
    setIsEventDialogOpen(true);
  };

  const handleSaveEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setEvents([...events, newEvent]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <CalendarSidebar 
          events={events}
          onCreateEvent={handleCreateEvent}
          selectedDate={selectedDate}
        />
        
        <div className="flex-1 overflow-auto">
          <Calendar
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        </div>
      </div>

      <EventDialog
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        selectedDate={selectedDate}
        selectedEvent={selectedEvent}
        onSaveEvent={handleSaveEvent}
      />
    </div>
  );
};

export default TaskCalendarApp;
