import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";

interface CalendarUser {
  id: string;
  name: string;
  phone: string;
  role: 'physician' | 'learner';
  monthlyShiftLimit: number;
  currentShiftCount: number;
}

interface CalendarSchedule {
  id: string;
  day: number;
  userId: string;
  userName: string;
  userRole: 'physician' | 'learner';
  status: 'available' | 'scheduled' | 'unavailable';
}

interface CalendarGridProps {
  month: number;
  year: number;
  schedules: CalendarSchedule[];
  users: CalendarUser[];
  currentUserId?: string;
  onDayClick: (day: number) => void;
  onTradeRequest?: (scheduleId: string) => void;
  isPublicView?: boolean;
}

export default function CalendarGrid({
  month,
  year,
  schedules,
  users,
  currentUserId,
  onDayClick,
  onTradeRequest,
  isPublicView = false
}: CalendarGridProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  const currentDate = new Date(year, month - 1, 1);
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfWeek = getDay(startOfMonth(currentDate));
  
  const handleDayClick = (day: number) => {
    if (isPublicView) return;
    setSelectedDay(day);
    onDayClick(day);
  };

  const getSchedulesForDay = (day: number) => {
    return schedules.filter(s => s.day === day);
  };

  const isUserScheduled = (day: number, userId?: string) => {
    if (!userId) return false;
    return schedules.some(s => s.day === day && s.userId === userId);
  };

  const canUserSchedule = (day: number, userId?: string) => {
    if (!userId || isPublicView) return false;
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    
    const userCurrentSchedules = schedules.filter(s => s.userId === userId).length;
    return userCurrentSchedules < user.monthlyShiftLimit && !isUserScheduled(day, userId);
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24"></div>);
    }
    
    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const daySchedules = getSchedulesForDay(day);
      const isUserDay = isUserScheduled(day, currentUserId);
      const canSchedule = canUserSchedule(day, currentUserId);
      
      days.push(
        <div
          key={day}
          className={cn(
            "h-24 border border-border p-2 hover-elevate cursor-pointer relative",
            selectedDay === day && "ring-2 ring-ring",
            isUserDay && "bg-primary/10 border-primary/30"
          )}
          onClick={() => handleDayClick(day)}
          data-testid={`calendar-day-${day}`}
        >
          <div className="font-medium text-sm">{day}</div>
          
          <div className="mt-1 space-y-1">
            {daySchedules.map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between">
                <Badge 
                  variant={schedule.userRole === 'physician' ? 'default' : 'secondary'}
                  className="text-xs truncate max-w-20"
                >
                  {schedule.userName}
                </Badge>
                {!isPublicView && onTradeRequest && schedule.userId !== currentUserId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-5 px-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTradeRequest(schedule.id);
                    }}
                    data-testid={`button-trade-${schedule.id}`}
                  >
                    Trade
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Availability indicator */}
          {!isPublicView && currentUserId && (
            <div className="absolute bottom-1 right-1">
              {isUserDay && (
                <div className="w-2 h-2 bg-primary rounded-full" title="You are scheduled"></div>
              )}
              {canSchedule && !isUserDay && (
                <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" title="Available to schedule"></div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="bg-white border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        {!isPublicView && currentUserId && (
          <div className="text-sm text-muted-foreground mt-1">
            {(() => {
              const user = users.find(u => u.id === currentUserId);
              const userScheduleCount = schedules.filter(s => s.userId === currentUserId).length;
              return `${userScheduleCount}/${user?.monthlyShiftLimit || 0} shifts selected this month`;
            })()}
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
      </div>
    </div>
  );
}