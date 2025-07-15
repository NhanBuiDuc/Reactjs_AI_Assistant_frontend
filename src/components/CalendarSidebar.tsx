// src\components\Calendar.tsx

import { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Settings, Search } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { Button } from '@/components/calendar_ui/button';
import { Input } from '@/components/calendar_ui/input';
import { Card } from '@/components/calendar_ui/card';
import { Separator } from '@/components/calendar_ui/separator';
import { CalendarEvent } from './Calendar';
import { cn } from '@/lib/utils';

interface CalendarSidebarProps {
  events: CalendarEvent[];
  onCreateEvent: () => void;
  selectedDate?: Date | null;
}

export const CalendarSidebar = ({ events, onCreateEvent, selectedDate }: CalendarSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const todayEvents = events.filter(event => isToday(event.date));
  const upcomingEvents = events
    .filter(event => event.date > new Date() && !isToday(event.date))
    .slice(0, 5);

  const filteredEvents = searchQuery
    ? events.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="w-80 h-full border-r border-border bg-background p-4 space-y-6">
      {/* Create Button */}
      <Button 
        onClick={onCreateEvent}
        className="w-full justify-start bg-primary hover:bg-primary-hover shadow-button"
        size="lg"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create
      </Button>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 hover:bg-calendar-hover"
        />
      </div>

      {/* Search Results */}
      {searchQuery && (
        <Card className="p-4 shadow-calendar">
          <h3 className="font-medium mb-3">Search Results</h3>
          {filteredEvents.length > 0 ? (
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-2 rounded hover:bg-calendar-hover cursor-pointer transition-colors"
                >
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(event.date, 'MMM d')}
                    {event.time && ` at ${event.time}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No events found</div>
          )}
        </Card>
      )}

      {/* Mini Calendar */}
      <Card className="p-4 shadow-calendar">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="h-4 w-4" />
          <h3 className="font-medium">
            {selectedDate ? format(selectedDate, 'MMMM yyyy') : format(new Date(), 'MMMM yyyy')}
          </h3>
        </div>
        <div className="text-sm text-muted-foreground">
          Calendar navigation coming soon...
        </div>
      </Card>

      {/* Today's Events */}
      {todayEvents.length > 0 && (
        <Card className="p-4 shadow-calendar">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-calendar-today rounded-full"></div>
            Today
          </h3>
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "p-2 rounded cursor-pointer transition-colors",
                  "bg-calendar-event-bg hover:bg-primary-light"
                )}
              >
                <div className="font-medium text-sm text-calendar-event">
                  {event.title}
                </div>
                {event.time && (
                  <div className="text-xs text-muted-foreground">
                    {event.time}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card className="p-4 shadow-calendar">
          <h3 className="font-medium mb-3">Upcoming</h3>
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="p-2 rounded hover:bg-calendar-hover cursor-pointer transition-colors"
              >
                <div className="font-medium text-sm">{event.title}</div>
                <div className="text-xs text-muted-foreground">
                  {format(event.date, 'MMM d')}
                  {event.time && ` at ${event.time}`}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Separator />

      {/* Settings */}
      <Button variant="ghost" className="w-full justify-start hover:bg-calendar-hover">
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
    </div>
  );
};