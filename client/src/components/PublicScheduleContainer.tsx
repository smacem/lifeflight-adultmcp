import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import PublicScheduleView from "./PublicScheduleView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import jsPDF from 'jspdf';
import logoImage from '@assets/IMG_4131_1757550683322.png';
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
    if (!publicData) return;
    
    const doc = new jsPDF();
    const daysInMonth = new Date(publicData.settings.year, publicData.settings.month, 0).getDate();
    
    // Helper function to center text
    const centerText = (text: string, x: number, y: number) => {
      const textWidth = doc.getTextWidth(text);
      doc.text(text, x - (textWidth / 2), y);
    };
    
    // Get month name
    const getMonthName = (monthNumber: number) => {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return monthNames[monthNumber - 1];
    };
    
    // Page background - blue
    doc.setFillColor(135, 185, 215);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Logo
    try {
      doc.addImage(logoImage, 'PNG', 15, 10, 30, 20);
    } catch {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('EHS LifeFlight', 15, 20);
    }
    
    // Title and subtitle
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Adult MCP Schedule', 50, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${getMonthName(publicData.settings.month)} ${publicData.settings.year}`, 50, 30);
    
    // TABLE LAYOUT
    const TABLE_START_Y = 50;
    const TABLE_LEFT = 15;
    const TABLE_WIDTH = 180;
    
    // Column definitions
    const COL_DAY_WIDTH = 30;
    const COL_MCP_WIDTH = 90;
    const COL_LEARNER_WIDTH = 60;
    
    // Column positions (left edges)
    const COL_DAY_X = TABLE_LEFT;
    const COL_MCP_X = COL_DAY_X + COL_DAY_WIDTH;
    const COL_LEARNER_X = COL_MCP_X + COL_MCP_WIDTH;
    
    // Column centers (for text centering)
    const COL_DAY_CENTER = COL_DAY_X + (COL_DAY_WIDTH / 2);
    const COL_MCP_CENTER = COL_MCP_X + (COL_MCP_WIDTH / 2);
    const COL_LEARNER_CENTER = COL_LEARNER_X + (COL_LEARNER_WIDTH / 2);
    
    // Row setup - calculate to fit on one page
    const HEADER_HEIGHT = 10;
    const AVAILABLE_HEIGHT = 240; // Space available for table content
    const ROW_HEIGHT = Math.max(6, Math.floor((AVAILABLE_HEIGHT - HEADER_HEIGHT) / daysInMonth)); // Dynamic row height
    const TABLE_HEIGHT = HEADER_HEIGHT + (daysInMonth * ROW_HEIGHT);
    
    // DRAW TABLE STRUCTURE
    // Table background
    doc.setFillColor(255, 235, 235);
    doc.rect(TABLE_LEFT, TABLE_START_Y, TABLE_WIDTH, TABLE_HEIGHT, 'F');
    
    // Table border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.rect(TABLE_LEFT, TABLE_START_Y, TABLE_WIDTH, TABLE_HEIGHT);
    
    // Column dividers
    doc.line(COL_MCP_X, TABLE_START_Y, COL_MCP_X, TABLE_START_Y + TABLE_HEIGHT);
    doc.line(COL_LEARNER_X, TABLE_START_Y, COL_LEARNER_X, TABLE_START_Y + TABLE_HEIGHT);
    
    // Header divider
    doc.line(TABLE_LEFT, TABLE_START_Y + HEADER_HEIGHT, TABLE_LEFT + TABLE_WIDTH, TABLE_START_Y + HEADER_HEIGHT);
    
    // HEADER ROW
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    const headerY = TABLE_START_Y + (HEADER_HEIGHT / 2) + 2;
    centerText('Day', COL_DAY_CENTER, headerY);
    centerText('Physician', COL_MCP_CENTER, headerY);
    centerText('Learner', COL_LEARNER_CENTER, headerY);
    
    // Get color for users (simplified for public view)
    const getUserColor = (userId: string, role: string) => {
      if (role === 'physician') {
        const user = publicData.users.find((u: any) => u.id === userId);
        if (user?.name.includes('Sarah')) return { r: 34, g: 197, b: 94 };
        if (user?.name.includes('Michael')) return { r: 139, g: 69, b: 19 };
        if (user?.name.includes('Emily')) return { r: 99, g: 102, b: 241 };
        return { r: 0, g: 0, b: 0 };
      }
      return { r: 107, g: 114, b: 128 };
    };
    
    // TABLE ROWS
    for (let day = 1; day <= daysInMonth; day++) {
      const rowY = TABLE_START_Y + HEADER_HEIGHT + ((day - 1) * ROW_HEIGHT);
      const textY = rowY + (ROW_HEIGHT / 2) + 3; // Proper vertical centering
      
      // Row divider (light gray)
      if (day < daysInMonth) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(TABLE_LEFT, rowY + ROW_HEIGHT, TABLE_LEFT + TABLE_WIDTH, rowY + ROW_HEIGHT);
        doc.setDrawColor(0, 0, 0);
      }
      
      // Day number
      doc.setFontSize(Math.min(9, ROW_HEIGHT - 2));
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      centerText(day.toString(), COL_DAY_CENTER, textY);
      
      // MCP column - find physician schedule for this day
      const mcpSchedule = publicData.schedules.find((s: any) => {
        const user = publicData.users.find((u: any) => u.id === s.userId);
        return s.day === day && user && user.role === 'physician';
      });
      const mcpUser = mcpSchedule ? publicData.users.find((u: any) => u.id === mcpSchedule.userId) : null;
      
      if (mcpSchedule && mcpUser) {
        const color = getUserColor(mcpSchedule.userId, 'physician');
        doc.setTextColor(color.r, color.g, color.b);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(Math.min(8, ROW_HEIGHT - 2));
        centerText(mcpUser.name, COL_MCP_CENTER, textY);
      } else {
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(Math.min(7, ROW_HEIGHT - 3));
        centerText('Available', COL_MCP_CENTER, textY);
      }
      
      // Learner column - find learner schedule for this day
      const learnerSchedule = publicData.schedules.find((s: any) => {
        const user = publicData.users.find((u: any) => u.id === s.userId);
        return s.day === day && user && user.role === 'learner';
      });
      const learnerUser = learnerSchedule ? publicData.users.find((u: any) => u.id === learnerSchedule.userId) : null;
      
      if (learnerSchedule && learnerUser) {
        const color = getUserColor(learnerSchedule.userId, 'learner');
        doc.setTextColor(color.r, color.g, color.b);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(Math.min(8, ROW_HEIGHT - 2));
        centerText(learnerUser.name, COL_LEARNER_CENTER, textY);
      } else {
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(Math.min(7, ROW_HEIGHT - 3));
        centerText('Available', COL_LEARNER_CENTER, textY);
      }
    }
    
    // Download the PDF
    doc.save(`EHS-LifeFlight-Schedule-${getMonthName(publicData.settings.month)}-${publicData.settings.year}.pdf`);
    
    toast({
      title: "Schedule Exported",
      description: `Adult MCP Schedule for ${getMonthName(publicData.settings.month)} ${publicData.settings.year} exported successfully.`,
    });
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
        userRole: (publicData.users.find((u: any) => u.id === schedule.userId)?.role === 'admin' ? 'physician' : publicData.users.find((u: any) => u.id === schedule.userId)?.role || 'physician') as 'physician' | 'learner'
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