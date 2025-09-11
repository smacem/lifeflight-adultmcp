import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import PublicScheduleView from "./PublicScheduleView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";

interface PublicScheduleData {
  schedules: Array<{
    id: string;
    day: number;
    userId: string;
  }>;
  users: Array<{
    id: string;
    name: string;
    phone: string;
    role: 'physician' | 'learner' | 'admin';
  }>;
  settings: {
    month: number;
    year: number;
  };
}

export default function PublicScheduleContainer() {
  const params = useParams();
  const token = params.token;

  const { data: publicData, isLoading, error } = useQuery<PublicScheduleData>({
    queryKey: ['/api/public', token],
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading schedule...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !publicData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span>Schedule Not Available</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This schedule is either not published or the link has expired.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact your supervisor for a current schedule link.
            </p>
            <Button
              onClick={() => window.close()}
              className="w-full"
            >
              Close Window
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleExportPDF = () => {
    // TODO: Implement public PDF export
    console.log('Export public PDF');
  };

  return (
    <PublicScheduleView
      month={publicData.settings.month}
      year={publicData.settings.year}
      schedules={publicData.schedules.map((schedule: any) => ({
        id: schedule.id,
        day: schedule.day,
        userId: schedule.userId,
        userName: publicData.users.find((u: any) => u.id === schedule.userId)?.name || 'Unknown',
        userRole: publicData.users.find((u: any) => u.id === schedule.userId)?.role || 'physician'
      }))}
      users={publicData.users.map((user: any) => ({
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role === 'admin' ? 'physician' : user.role
      }))}
      onExportPDF={handleExportPDF}
    />
  );
}