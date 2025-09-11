import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Users, Calendar, Share2, Save, Download } from "lucide-react";
import { createEvent } from 'ics';

interface User {
  id: string;
  name: string;
  role: 'physician' | 'learner';
  monthlyShiftLimit: number;
  currentShiftCount: number;
  phone?: string;
}

interface Schedule {
  id: string;
  day: number;
  userId: string;
  userName: string;
  userRole: 'physician' | 'learner';
  status?: string;
}

interface MonthlySettings {
  month: number;
  year: number;
  isPublished: boolean;
  publicShareToken?: string;
}

interface AdminPanelProps {
  users: User[];
  schedules: Schedule[];
  monthlySettings: MonthlySettings;
  onUpdateUserLimit: (userId: string, newLimit: number) => void;
  onUpdatePublishStatus: (isPublished: boolean) => void;
  onGenerateShareLink: () => void;
  onSaveSettings: () => void;
}

export default function AdminPanel({
  users,
  schedules,
  monthlySettings,
  onUpdateUserLimit,
  onUpdatePublishStatus,
  onGenerateShareLink,
  onSaveSettings
}: AdminPanelProps) {
  const [localSettings, setLocalSettings] = useState(monthlySettings);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const handleLimitChange = (userId: string, value: string) => {
    // Convert to number and clamp between 0-31
    const numericValue = value === '' ? 0 : parseInt(value) || 0;
    const clampedValue = Math.min(31, Math.max(0, numericValue));
    
    // Update immediately
    onUpdateUserLimit(userId, clampedValue);
  };

  const handlePublishToggle = (isPublished: boolean) => {
    setLocalSettings(prev => ({ ...prev, isPublished }));
    onUpdatePublishStatus(isPublished);
  };

  const physicians = users.filter(u => u.role === 'physician');
  const learners = users.filter(u => u.role === 'learner');

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const generateCalendarFile = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const userSchedules = schedules.filter(s => s.userId === userId);
    
    if (userSchedules.length === 0) {
      alert('No shifts scheduled for this user in the current month.');
      return;
    }

    const events = userSchedules.map(schedule => {
      const eventDate = new Date(localSettings.year, localSettings.month - 1, schedule.day);
      const startTime = new Date(eventDate);
      startTime.setHours(7, 0, 0); // Default 7 AM start
      const endTime = new Date(eventDate);
      endTime.setHours(19, 0, 0); // Default 7 PM end (12-hour shift)

      return {
        title: `EHS LifeFlight ${user.role === 'physician' ? 'MCP' : 'Learner'} Shift`,
        description: `${user.name} - ${user.role === 'physician' ? 'Physician' : 'Learner'} shift at EHS LifeFlight Adult MCP`,
        location: 'EHS LifeFlight',
        start: [startTime.getFullYear(), startTime.getMonth() + 1, startTime.getDate(), startTime.getHours(), startTime.getMinutes()] as [number, number, number, number, number],
        end: [endTime.getFullYear(), endTime.getMonth() + 1, endTime.getDate(), endTime.getHours(), endTime.getMinutes()] as [number, number, number, number, number],
        status: 'CONFIRMED' as const,
        busyStatus: 'BUSY' as const,
        organizer: { name: 'EHS LifeFlight Scheduling', email: 'scheduling@ehs.com' },
        attendees: [{ name: user.name, email: `${user.name.toLowerCase().replace(/\s+/g, '.')}@ehs.com` }]
      };
    });

    try {
      // Generate multiple events
      const icsFiles = await Promise.all(events.map(event => {
        return new Promise((resolve, reject) => {
          createEvent(event, (error, value) => {
            if (error) reject(error);
            else resolve(value);
          });
        });
      }));

      // Combine all events into a single ICS file
      const icsHeader = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//EHS LifeFlight//Adult MCP Scheduler//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ].join('\r\n');

      const icsFooter = 'END:VCALENDAR';
      
      // Extract just the VEVENT portions from each file
      const eventBodies = icsFiles.map(ics => {
        const eventMatch = (ics as string).match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/);
        return eventMatch ? eventMatch[0] : '';
      }).filter(Boolean).join('\r\n');

      const combinedICS = [icsHeader, eventBodies, icsFooter].join('\r\n');

      // Download file
      const blob = new Blob([combinedICS], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${user.name.replace(/\s+/g, '_')}_EHS_Schedule_${getMonthName(localSettings.month)}_${localSettings.year}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Calendar file downloaded successfully for ${user.name}!`);
    } catch (error) {
      console.error('Error generating calendar file:', error);
      alert('Error generating calendar file. Please try again.');
    }
  };

  const UserLimitCard = ({ user }: { user: User }) => {

    return (
      <Card className="hover-elevate">
        <CardContent className="p-4">
          <div className="flex items-center justify-start gap-3 mb-3">
            <div>
              <div className="font-medium">{user.name}</div>
              <Badge variant={user.role === 'physician' ? 'default' : 'secondary'} className="text-xs">
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`limit-${user.id}`} className="text-sm">
              Monthly Shift Limit
            </Label>
            <Input
              id={`limit-${user.id}`}
              type="number"
              min="0"
              max="31"
              value={user.monthlyShiftLimit}
              onChange={(e) => handleLimitChange(user.id, e.target.value)}
              className="w-20"
              data-testid={`input-limit-${user.id}`}
            />
            <div className="text-xs text-muted-foreground">
              Current: {user.currentShiftCount}/{user.monthlyShiftLimit} shifts
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <h2 className="text-2xl font-bold">Admin Panel</h2>
        </div>
      </div>

      {/* Schedule Publishing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="w-4 h-4" />
            <span>Schedule Publishing</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="publish-toggle" className="text-base font-medium">
                Public Schedule Access
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow public access to {getMonthName(localSettings.month)} {localSettings.year} schedule
              </p>
            </div>
            <Switch
              id="publish-toggle"
              checked={localSettings.isPublished}
              onCheckedChange={handlePublishToggle}
              data-testid="switch-publish-schedule"
            />
          </div>

          {localSettings.isPublished && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <Label>Share Link</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onGenerateShareLink}
                  data-testid="button-generate-share-link"
                >
                  Generate New Link
                </Button>
              </div>
              {localSettings.publicShareToken && (
                <div className="font-mono text-sm p-2 bg-background border rounded">
                  https://scheduler.ehs.com/public/{localSettings.publicShareToken}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Monthly Shift Limits */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Monthly Shift Limits</h3>
          <Badge variant="outline">
            {getMonthName(localSettings.month)} {localSettings.year}
          </Badge>
        </div>

        {/* Physicians */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <h4 className="font-medium">Physicians</h4>
            <Badge variant="outline">{physicians.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {physicians.map(user => (
              <UserLimitCard key={user.id} user={user} />
            ))}
          </div>
        </div>

        {/* Learners */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <h4 className="font-medium">Learners</h4>
            <Badge variant="outline">{learners.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {learners.map(user => (
              <UserLimitCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Calendar Download</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="user-select" className="text-base font-medium">
              Download Personal Schedule
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Doctors can download their {getMonthName(localSettings.month)} {localSettings.year} shifts as a calendar file (ICS) that works with Google Calendar, Apple Calendar, Outlook, and more.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <Label htmlFor="user-select">Select Doctor:</Label>
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="select-calendar-user"
              >
                <option value="">Choose a doctor...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
            
            <Button
              onClick={() => selectedUserId && generateCalendarFile(selectedUserId)}
              disabled={!selectedUserId}
              className="flex items-center space-x-2"
              data-testid="button-download-calendar"
            >
              <Download className="w-4 h-4" />
              <span>Download ICS</span>
            </Button>
          </div>
          
          {selectedUserId && (
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <strong>📱 Compatible with:</strong> Google Calendar, Apple Calendar, Outlook, Android Calendar, and any calendar app that supports ICS files.
              <br />
              <strong>⏰ Default times:</strong> Shifts are set for 7:00 AM - 7:00 PM (12-hour shifts). You can adjust times in your calendar after importing.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Schedule Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {physicians.reduce((sum, p) => sum + p.currentShiftCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Physician Shifts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {learners.reduce((sum, l) => sum + l.currentShiftCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Learner Shifts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {users.reduce((sum, u) => sum + u.currentShiftCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Shifts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {users.filter(u => u.currentShiftCount >= u.monthlyShiftLimit).length}
              </div>
              <div className="text-sm text-muted-foreground">At Limit</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}