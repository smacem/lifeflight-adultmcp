import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Users, Calendar, Share2, Save } from "lucide-react";

interface User {
  id: string;
  name: string;
  role: 'physician' | 'learner';
  monthlyShiftLimit: number;
  currentShiftCount: number;
}

interface MonthlySettings {
  month: number;
  year: number;
  isPublished: boolean;
  publicShareToken?: string;
}

interface AdminPanelProps {
  users: User[];
  monthlySettings: MonthlySettings;
  onUpdateUserLimit: (userId: string, newLimit: number) => void;
  onUpdatePublishStatus: (isPublished: boolean) => void;
  onGenerateShareLink: () => void;
  onSaveSettings: () => void;
}

export default function AdminPanel({
  users,
  monthlySettings,
  onUpdateUserLimit,
  onUpdatePublishStatus,
  onGenerateShareLink,
  onSaveSettings
}: AdminPanelProps) {
  const [localSettings, setLocalSettings] = useState(monthlySettings);
  const [userLimits, setUserLimits] = useState<Record<string, number>>(
    users.reduce((acc, user) => ({
      ...acc,
      [user.id]: user.monthlyShiftLimit
    }), {})
  );

  const handleLimitChange = (userId: string, newLimit: number) => {
    setUserLimits(prev => ({
      ...prev,
      [userId]: newLimit
    }));
  };

  const applyLimitChanges = () => {
    Object.entries(userLimits).forEach(([userId, limit]) => {
      onUpdateUserLimit(userId, limit);
    });
    onSaveSettings();
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

  const UserLimitCard = ({ user }: { user: User }) => {
    const currentLimit = userLimits[user.id];
    const hasChanged = currentLimit !== user.monthlyShiftLimit;

    return (
      <Card className={`hover-elevate ${hasChanged ? 'border-primary' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium">{user.name}</div>
              <Badge variant={user.role === 'physician' ? 'default' : 'secondary'} className="text-xs">
                {user.role}
              </Badge>
            </div>
            {hasChanged && (
              <Badge variant="outline" className="text-xs">
                Changed
              </Badge>
            )}
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
              value={currentLimit}
              onChange={(e) => handleLimitChange(user.id, parseInt(e.target.value) || 0)}
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
        <Button onClick={applyLimitChanges} data-testid="button-save-settings">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
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