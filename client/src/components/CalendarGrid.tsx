import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

// Helper function to get user initials
const getUserInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// Helper function to get consistent color for each user
const getUserColor = (userId: string, userRole: 'physician' | 'learner'): string => {
  if (userRole === 'learner') {
    return 'bg-secondary text-secondary-foreground'; // Keep learners as secondary (gray)
  }
  
  // Color palette for physicians
  const physicianColors = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200', 
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-orange-100 text-orange-800 border-orange-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-teal-100 text-teal-800 border-teal-200',
    'bg-cyan-100 text-cyan-800 border-cyan-200'
  ];
  
  // Generate consistent index based on userId
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return physicianColors[hash % physicianColors.length];
};

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
  isPublicView?: boolean;
}

export default function CalendarGrid({
  month,
  year,
  schedules,
  users,
  currentUserId,
  onDayClick,
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
    
    // Check if day is already claimed by someone of the SAME role
    const existingSameRole = schedules.find(s => s.day === day && s.userRole === user.role);
    if (existingSameRole && existingSameRole.userId !== userId) return false;
    
    const userCurrentSchedules = schedules.filter(s => s.userId === userId).length;
    return userCurrentSchedules < user.monthlyShiftLimit && !isUserScheduled(day, userId);
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-32"></div>);
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
            "h-32 border border-border p-2 hover-elevate cursor-pointer relative",
            selectedDay === day && "ring-2 ring-ring",
            isUserDay && "bg-primary/10 border-primary/30"
          )}
          onClick={() => handleDayClick(day)}
          data-testid={`calendar-day-${day}`}
        >
          <div className="font-medium text-sm mb-2">{day}</div>
          
          <div className="space-y-1">
            {daySchedules.map((schedule) => {
              const user = users.find(u => u.id === schedule.userId);
              const initials = getUserInitials(schedule.userName);
              
              return (
                <TooltipProvider key={schedule.id}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge 
                        className={`text-xs px-2 py-1 cursor-help flex items-center justify-center min-w-8 h-6 ${getUserColor(schedule.userId, schedule.userRole)}`}
                      >
                        {initials}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="text-sm">
                        <div className="font-medium">{schedule.userName}</div>
                        <div className="text-muted-foreground">{user?.phone || 'No phone'}</div>
                        <div className="text-xs text-muted-foreground capitalize">{schedule.userRole}</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
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