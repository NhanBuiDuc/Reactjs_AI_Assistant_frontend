// src/components/Calendar.tsx

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/calendar_ui/button';
import { Card } from '@/components/calendar_ui/card';
import { cn } from '@/lib/utils';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  color?: string;
  description?: string;
  type?: 'task' | 'event' | 'reminder';
  completed?: boolean;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
  onRefreshEvents?: () => void;
  isLoading?: boolean;
}

export const Calendar = ({ 
  events = [], 
  onDateClick, 
  onEventClick, 
  onAddEvent,
  onRefreshEvents,
  isLoading = false 
}: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const handleAddEvent = () => {
    const dateToUse = selectedDate || new Date();
    onAddEvent?.(dateToUse);
  };

  const handleRefresh = () => {
    console.log('🔄 Refreshing calendar events...');
    onRefreshEvents?.();
  };

  // Check if current view contains today
  const today = new Date();
  const isCurrentMonthToday = isSameMonth(today, currentDate);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Gradient Background Container */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl p-6 shadow-2xl border border-white/50">
        
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">
                  {format(currentDate, 'MMMM yyyy')}
                </h1>
              </div>
              <Button
                variant={isCurrentMonthToday ? "default" : "outline"}
                size="sm"
                onClick={goToToday}
                className={cn(
                  "transition-all duration-300 font-semibold",
                  isCurrentMonthToday 
                    ? "bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg backdrop-blur-sm ring-2 ring-white/30" 
                    : "bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                )}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {isCurrentMonthToday ? "📅 Today" : "Go to Today"}
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Navigation */}
              <div className="flex items-center gap-1 mr-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth('prev')}
                  className="hover:bg-white/20 text-white backdrop-blur-sm rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth('next')}
                  className="hover:bg-white/20 text-white backdrop-blur-sm rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Action Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm font-medium"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleAddEvent}
                className="bg-white hover:bg-white/90 text-purple-600 shadow-lg font-semibold backdrop-blur-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>

          {/* Selected Date Info */}
          {selectedDate && (
            <div className="mt-4 bg-white/10 border border-white/20 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-sm text-white/90">
                Selected: <span className="font-semibold text-white">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                {isSameDay(selectedDate, today) && <span className="ml-2 text-yellow-200">• Today</span>}
              </p>
            </div>
          )}
        </div>

        {/* Calendar Grid */}
        <Card className="p-0 shadow-xl overflow-hidden border-0 bg-white/80 backdrop-blur-sm">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            {weekdays.map((day) => (
              <div
                key={day}
                className="p-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wide"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 bg-white">
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[130px] p-3 border-b border-r border-gray-100 cursor-pointer transition-all duration-300 group",
                    "hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:shadow-lg hover:scale-[1.02] hover:z-10",
                    !isCurrentMonth && "bg-gray-50/70",
                    isSelected && "bg-gradient-to-br from-blue-100 to-indigo-100 ring-2 ring-blue-400 ring-inset shadow-lg",
                    isDayToday && !isSelected && "bg-gradient-to-br from-yellow-50 to-orange-50 ring-2 ring-yellow-400 ring-inset"
                  )}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="flex flex-col h-full">
                    {/* Day Number */}
                    <div
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-300 mb-2",
                        isDayToday && "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg ring-2 ring-blue-300 animate-pulse",
                        !isDayToday && isCurrentMonth && "text-gray-700 group-hover:bg-blue-100 group-hover:text-blue-700",
                        !isDayToday && !isCurrentMonth && "text-gray-400",
                        isWeekend && isCurrentMonth && !isDayToday && "text-purple-600 font-semibold",
                        isSelected && !isDayToday && "bg-blue-200 text-blue-800 ring-2 ring-blue-400"
                      )}
                    >
                      {isDayToday ? (
                        <span className="flex flex-col items-center">
                          <span className="text-xs">TODAY</span>
                          <span className="text-lg">{format(day, 'd')}</span>
                        </span>
                      ) : (
                        format(day, 'd')
                      )}
                    </div>

                    {/* Events */}
                    <div className="flex-1 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "px-2 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200",
                            "shadow-sm border backdrop-blur-sm hover:shadow-md hover:scale-105 hover:z-10",
                            event.type === 'task' && event.completed && "bg-green-100 text-green-800 border-green-200 line-through opacity-75",
                            event.type === 'task' && !event.completed && "bg-yellow-100 text-yellow-800 border-yellow-200",
                            event.type === 'event' && "bg-blue-100 text-blue-800 border-blue-200",
                            event.type === 'reminder' && "bg-purple-100 text-purple-800 border-purple-200",
                            !event.type && "bg-indigo-100 text-indigo-800 border-indigo-200"
                          )}
                          style={event.color ? { 
                            backgroundColor: `${event.color}15`, 
                            borderColor: `${event.color}40`,
                            color: event.color 
                          } : {}}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                        >
                          <div className="flex items-center gap-1">
                            {event.type === 'task' && (
                              <span className="text-xs">
                                {event.completed ? '✅' : '📋'}
                              </span>
                            )}
                            {event.type === 'event' && <span className="text-xs">📅</span>}
                            {event.type === 'reminder' && <span className="text-xs">🔔</span>}
                            {event.time && (
                              <span className="text-xs opacity-75 font-normal">
                                {event.time}
                              </span>
                            )}
                          </div>
                          <span className="truncate block font-medium">{event.title}</span>
                        </div>
                      ))}
                      
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded-lg text-center border border-gray-200">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                      
                      {dayEvents.length === 0 && isSelected && (
                        <div 
                          className="text-xs text-blue-600 px-2 py-1 bg-blue-50 rounded-lg text-center cursor-pointer hover:bg-blue-100 transition-colors border border-blue-200 border-dashed"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddEvent();
                          }}
                        >
                          <Plus className="h-3 w-3 inline mr-1" />
                          Add event
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Quick Stats with Gradient */}
        <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <strong>{events.length}</strong> total events
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <strong>{getEventsForDate(today).length}</strong> today
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <strong>{events.filter(e => e.type === 'task' && !e.completed).length}</strong> pending tasks
              </span>
            </div>
            {selectedDate && (
              <span className="text-indigo-600 font-medium">
                {getEventsForDate(selectedDate).length} events on {format(selectedDate, 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};