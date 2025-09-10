import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Phone, User } from "lucide-react";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";

interface PublicUser {
  id: string;
  name: string;
  phone: string;
  role: 'physician' | 'learner';
}

interface PublicSchedule {
  id: string;
  day: number;
  userId: string;
  userName: string;
  userRole: 'physician' | 'learner';
}

interface PublicScheduleViewProps {
  month: number;
  year: number;
  schedules: PublicSchedule[];
  users: PublicUser[];
  onExportPDF: () => void;
}

export default function PublicScheduleView({
  month,
  year,
  schedules,
  users,
  onExportPDF
}: PublicScheduleViewProps) {
  const currentDate = new Date(year, month - 1, 1);
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfWeek = getDay(startOfMonth(currentDate));

  const getSchedulesForDay = (day: number) => {
    return schedules.filter(s => s.day === day);
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-20"></div>);
    }
    
    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const daySchedules = getSchedulesForDay(day);
      
      days.push(
        <div
          key={day}
          className="h-20 border border-border p-2 relative"
        >
          <div className="font-medium text-sm">{day}</div>
          
          <div className="mt-1 space-y-1">
            {daySchedules.map((schedule) => (
              <Badge 
                key={schedule.id}
                variant={schedule.userRole === 'physician' ? 'default' : 'secondary'}
                className="text-xs block w-full truncate"
              >
                {schedule.userName}
              </Badge>
            ))}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const physicians = users.filter(u => u.role === 'physician');
  const learners = users.filter(u => u.role === 'learner');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold">
              <span className="text-primary">EHS</span>
              <span className="text-destructive ml-1">LifeFlight</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Adult MCP Schedule - {getMonthName(month)} {year}
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={onExportPDF}
            data-testid="button-export-public-pdf"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Schedule Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {getMonthName(month)} {year} Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Days of week header */}
            <div className="grid grid-cols-7 mb-2">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Physicians */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Physicians</span>
                <Badge variant="outline">{physicians.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {physicians.map(physician => (
                  <div key={physician.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="font-medium">{physician.name}</div>
                      <Badge variant="default" className="text-xs">
                        Physician
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{physician.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Learners */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Learners</span>
                <Badge variant="outline">{learners.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {learners.map(learner => (
                  <div key={learner.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="font-medium">{learner.name}</div>
                      <Badge variant="secondary" className="text-xs">
                        Learner
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{learner.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
          <p>EHS LifeFlight Adult MCP Self-Scheduler</p>
          <p>For schedule updates or questions, please contact your supervisor.</p>
        </div>
      </div>
    </div>
  );
}