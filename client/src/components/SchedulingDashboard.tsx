import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "./Header";
import CalendarGrid from "./CalendarGrid";
import TableView from "./TableView";
import UserManagement from "./UserManagement";
import ConfirmTradeDialog from "./ConfirmTradeDialog";
import AdminPanel from "./AdminPanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Share } from 'lucide-react';
import jsPDF from 'jspdf';
import logoImage from "@assets/IMG_4131_1757550683322.png";

// No current user - users select themselves as active user for general access

// TODO: remove mock data
const mockUsers = [
  { id: '1', name: 'Dr. Sarah Smith', phone: '555-0101', role: 'physician' as const, monthlyShiftLimit: 8, isActive: true, currentShiftCount: 3 },
  { id: '2', name: 'Dr. Michael Johnson', phone: '555-0102', role: 'physician' as const, monthlyShiftLimit: 8, isActive: true, currentShiftCount: 5 },
  { id: '3', name: 'Dr. Emily Chen', phone: '555-0103', role: 'physician' as const, monthlyShiftLimit: 6, isActive: true, currentShiftCount: 6 },
  { id: '4', name: 'Medical Student Alex', phone: '555-0201', role: 'learner' as const, monthlyShiftLimit: 4, isActive: true, currentShiftCount: 2 },
  { id: '5', name: 'Resident Taylor', phone: '555-0202', role: 'learner' as const, monthlyShiftLimit: 6, isActive: true, currentShiftCount: 4 },
];

// TODO: remove mock data
const mockSchedules = [
  { id: 's1', day: 1, userId: '1', userName: 'Dr. Sarah Smith', userRole: 'physician' as const, status: 'scheduled' as const },
  { id: 's2', day: 3, userId: '2', userName: 'Dr. Michael Johnson', userRole: 'physician' as const, status: 'scheduled' as const },
  { id: 's3', day: 5, userId: '4', userName: 'Medical Student Alex', userRole: 'learner' as const, status: 'scheduled' as const },
  { id: 's4', day: 7, userId: '1', userName: 'Dr. Sarah Smith', userRole: 'physician' as const, status: 'scheduled' as const },
  { id: 's5', day: 10, userId: '3', userName: 'Dr. Emily Chen', userRole: 'physician' as const, status: 'scheduled' as const },
  { id: 's6', day: 12, userId: '5', userName: 'Resident Taylor', userRole: 'learner' as const, status: 'scheduled' as const },
  { id: 's7', day: 15, userId: '2', userName: 'Dr. Michael Johnson', userRole: 'physician' as const, status: 'scheduled' as const },
];

// TODO: remove mock data
const mockTradeRequests = [
  {
    id: 'tr1',
    fromUserId: '2',
    fromUserName: 'Dr. Michael Johnson',
    toUserId: '1',
    toUserName: 'Dr. Sarah Smith',
    scheduleId: 's2',
    shiftDate: new Date(2024, 0, 3),
    status: 'pending' as const,
    requestedAt: new Date(2024, 0, 1),
  }
];

export default function SchedulingDashboard() {
  const [currentMonth, setCurrentMonth] = useState("January 2024");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [users, setUsers] = useState(mockUsers);
  const [schedules, setSchedules] = useState(mockSchedules);
  const [tradeRequests, setTradeRequests] = useState(mockTradeRequests);
  const [activeMcpId, setActiveMcpId] = useState<string>("");
  const [monthlySettings, setMonthlySettings] = useState({
    month: 1,
    year: 2024,
    isPublished: true,
    publicShareToken: 'abc123def456'
  });

  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
    console.log('Month changed to:', month);
  };

  // Helper function to parse the current month string into month/year numbers
  const parseCurrentMonth = () => {
    // currentMonth format: "January 2024", "February 2024", etc.
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const [monthName, yearStr] = currentMonth.split(' ');
    const month = monthNames.indexOf(monthName) + 1; // 1-based month
    const year = parseInt(yearStr);
    return { month, year };
  };

  const { month: selectedMonth, year: selectedYear } = parseCurrentMonth();

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date(selectedYear, selectedMonth - 1, 1);
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    
    // Set blue background (less aqua, more blue)
    doc.setFillColor(135, 185, 215); // More blue, less aqua
    doc.rect(0, 0, 210, 297, 'F'); // A4 page size
    
    // Add EHS LifeFlight logo at top left
    try {
      doc.addImage(logoImage, 'PNG', 15, 10, 30, 20); // x, y, width, height
    } catch (error) {
      console.warn('Could not add logo image, using text fallback');
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('EHS LifeFlight', 15, 20);
    }
    
    // Add header below logo  
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Adult MCP Schedule', 50, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(currentMonth, 50, 30);
    
    // Table setup with dynamic scaling for full month
    const startY = 55;
    const dayColX = 15;
    const dayWidth = 30;
    const mcpWidth = 80;
    const mcpColX = dayColX + dayWidth; // 45
    const learnerColX = mcpColX + mcpWidth; // 125
    const tableWidth = 180;
    const maxTableHeight = 220; // Leave space for header and footer  
    const rowHeight = Math.max(6, Math.min(8, Math.floor(maxTableHeight / (daysInMonth + 1)))); // More aggressive scaling for single page
    const actualTableHeight = (daysInMonth + 1) * rowHeight;
    
    // Draw light red table background
    doc.setFillColor(255, 235, 235); // Light red
    doc.rect(15, startY - 5, tableWidth, actualTableHeight + 5, 'F');
    
    // Draw table border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(15, startY - 5, tableWidth, actualTableHeight + 5);
    
    // Column separators
    doc.line(mcpColX, startY - 5, mcpColX, startY + actualTableHeight); // After Day column
    doc.line(learnerColX, startY - 5, learnerColX, startY + actualTableHeight); // After MCP column
    
    // Table headers - center horizontally in each column
    const headerFontSize = Math.max(8, Math.min(10, rowHeight * 0.9));
    doc.setFontSize(headerFontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    // Calculate column centers for text alignment - manual centering approach
    const dayColCenter = dayColX + (dayWidth / 2);
    const mcpColCenter = mcpColX + (mcpWidth / 2);
    const learnerWidth = tableWidth - dayWidth - mcpWidth; // 70
    const learnerColCenter = learnerColX + (learnerWidth / 2);
    
    // Headers with manual precise centering - no jsPDF options
    doc.setFontSize(headerFontSize);
    doc.setFont('helvetica', 'bold');
    
    // Calculate exact positions for perfect centering
    const day_width = doc.getTextWidth('Day');
    const mcp_width = doc.getTextWidth('MCP (Physician)');
    const learner_width = doc.getTextWidth('Learner');
    
    // Position text exactly at center minus half width
    doc.text('Day', dayColCenter - (day_width / 2), startY);
    doc.text('MCP (Physician)', mcpColCenter - (mcp_width / 2), startY);
    doc.text('Learner', learnerColCenter - (learner_width / 2), startY);
    
    // Draw header line
    doc.line(15, startY + 2, 195, startY + 2);
    
    // Helper function to get user color (similar to TableView)
    const getUserColor = (userId: string, userRole: string) => {
      if (userRole === 'physician') {
        const user = users.find(u => u.id === userId);
        if (user?.name.includes('Sarah')) return { r: 34, g: 197, b: 94 }; // Green
        if (user?.name.includes('Michael')) return { r: 139, g: 69, b: 19 }; // Brown
        if (user?.name.includes('Emily')) return { r: 99, g: 102, b: 241 }; // Blue
        return { r: 0, g: 0, b: 0 }; // Default black
      }
      return { r: 107, g: 114, b: 128 }; // Gray for learners
    };

    // Table data
    doc.setFont('helvetica', 'normal');
    let currentY = startY + rowHeight;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const mcpSchedule = schedules.find(s => s.day === day && s.userRole === 'physician');
      const learnerSchedule = schedules.find(s => s.day === day && s.userRole === 'learner');
      
      // Draw row separator
      if (day > 1) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(15, currentY - rowHeight/2, 195, currentY - rowHeight/2);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
      }
      
      // Day number - center in cell
      doc.setTextColor(0, 0, 0);
      const textFontSize = Math.max(7, Math.min(9, rowHeight * 0.75));
      doc.setFontSize(textFontSize);
      doc.setFont('helvetica', 'bold');
      // Calculate precise text positioning
      const textY = currentY - (rowHeight * 0.3); // Adjust for better visual centering
      const dayText = day.toString();
      const dayWidth = doc.getTextWidth(dayText);
      doc.text(dayText, dayColCenter - (dayWidth / 2), textY);
      
      // MCP column
      if (mcpSchedule) {
        const mcpUser = users.find(u => u.id === mcpSchedule.userId);
        const color = getUserColor(mcpSchedule.userId, 'physician');
        doc.setTextColor(color.r, color.g, color.b);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(textFontSize);
        const nameWidth = doc.getTextWidth(mcpSchedule.userName);
        doc.text(mcpSchedule.userName, mcpColCenter - (nameWidth / 2), textY);
        
        if (mcpUser?.phone && rowHeight > 7) {
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'normal');
          const phoneFontSize = Math.max(5, textFontSize * 0.7);
          doc.setFontSize(phoneFontSize);
          const phoneWidth = doc.getTextWidth(mcpUser.phone);
          doc.text(mcpUser.phone, mcpColCenter - (phoneWidth / 2), textY + (rowHeight * 0.25));
          doc.setFontSize(textFontSize);
        }
      } else {
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(textFontSize);
        const availWidth = doc.getTextWidth('Available');
        doc.text('Available', mcpColCenter - (availWidth / 2), textY);
      }
      
      // Learner column - only show if there's a learner scheduled (no "Available" text)
      if (learnerSchedule) {
        const learnerUser = users.find(u => u.id === learnerSchedule.userId);
        const color = getUserColor(learnerSchedule.userId, 'learner');
        doc.setTextColor(color.r, color.g, color.b);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(textFontSize);
        const learnerNameWidth = doc.getTextWidth(learnerSchedule.userName);
        doc.text(learnerSchedule.userName, learnerColCenter - (learnerNameWidth / 2), textY);
        
        if (learnerUser?.phone && rowHeight > 7) {
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'normal');
          const phoneFontSize = Math.max(5, textFontSize * 0.7);
          doc.setFontSize(phoneFontSize);
          const learnerPhoneWidth = doc.getTextWidth(learnerUser.phone);
          doc.text(learnerUser.phone, learnerColCenter - (learnerPhoneWidth / 2), textY + (rowHeight * 0.25));
          doc.setFontSize(textFontSize);
        }
      }
      // Note: No "Available" text for empty learner shifts as requested
      
      currentY += rowHeight;
      
      // Add new page if needed (should not be needed with proper scaling)
      if (currentY > 275) {
        doc.addPage();
        // Set background for new page
        doc.setFillColor(135, 185, 215);
        doc.rect(0, 0, 210, 297, 'F');
        currentY = 30;
      }
    }
    
    doc.save(`EHS-LifeFlight-Schedule-${currentMonth.replace(' ', '-')}.pdf`);
    
    toast({
      title: "PDF Generated",
      description: `Table-formatted schedule for ${currentMonth} has been exported to PDF.`,
    });
  };

  const handleShare = () => {
    // Generate simplified stakeholder-friendly link
    const simpleShareLink = `scheduler.ehs.com/view/${monthlySettings.publicShareToken}`;
    setShareLink(simpleShareLink);
    setShareDialogOpen(true);
  };

  const handleSettings = () => {
    console.log('Opening admin settings');
  };

  const handleActiveMcpChange = (mcpId: string) => {
    setActiveMcpId(mcpId);
    console.log('Active MCP changed to:', mcpId);
  };

  const handleDayClick = (day: number) => {
    // Require active user selection for scheduling
    if (!activeMcpId) {
      toast({
        title: "No Active User Selected", 
        description: "Please select an Active User to schedule shifts.",
        variant: "destructive"
      });
      return;
    }

    const userId = activeMcpId;
    const user = users.find(u => u.id === userId);
    if (!user) {
      toast({
        title: "User Not Found", 
        description: "The selected active user was not found.",
        variant: "destructive"
      });
      return;
    }

    // Check if day is already locked by another person of the same role
    if (user.role === 'physician') {
      const existingPhysician = schedules.find(s => s.day === day && s.userRole === 'physician');
      if (existingPhysician && existingPhysician.userId !== userId) {
        const existingUser = users.find(u => u.id === existingPhysician.userId);
        toast({
          title: "Day Locked for MCPs",
          description: `This day is already claimed by MCP ${existingUser?.name || 'another physician'}. Only one MCP per day allowed.`,
          variant: "destructive"
        });
        return;
      }
    } else if (user.role === 'learner') {
      const existingLearner = schedules.find(s => s.day === day && s.userRole === 'learner');
      if (existingLearner && existingLearner.userId !== userId) {
        const existingUser = users.find(u => u.id === existingLearner.userId);
        toast({
          title: "Day Locked for Learners",
          description: `This day is already claimed by learner ${existingUser?.name || 'another learner'}. Only one learner per day allowed.`,
          variant: "destructive"
        });
        return;
      }
    }

    const existingSchedule = schedules.find(s => s.day === day && s.userId === userId);
    
    if (existingSchedule) {
      // Remove the schedule
      setSchedules(prev => prev.filter(s => s.id !== existingSchedule.id));
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, currentShiftCount: u.currentShiftCount - 1 }
          : u
      ));
      toast({
        title: "Shift Removed",
        description: `${user.name} has been removed from ${currentMonth.split(' ')[0]} ${day}.`,
      });
    } else if (user.currentShiftCount < user.monthlyShiftLimit) {
      // Add the schedule
      const newSchedule = {
        id: `s${Date.now()}`,
        day,
        userId: userId,
        userName: user.name,
        userRole: user.role,
        status: 'scheduled' as const
      };
      setSchedules(prev => [...prev, newSchedule]);
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, currentShiftCount: u.currentShiftCount + 1 }
          : u
      ));
      toast({
        title: "Shift Added",
        description: `${user.name} has been scheduled for ${currentMonth.split(' ')[0]} ${day}.`,
      });
    } else {
      toast({
        title: "Shift Limit Reached",
        description: `${user.name} has reached the monthly limit of ${user.monthlyShiftLimit} shifts.`,
        variant: "destructive"
      });
    }
  };


  const handleAddUser = (userData: any) => {
    const newUser = {
      ...userData,
      id: `user${Date.now()}`,
      currentShiftCount: 0
    };
    setUsers(prev => [...prev, newUser]);
    toast({
      title: "User Added",
      description: `${userData.name} has been added to the team.`,
    });
  };

  const handleUpdateUser = (id: string, updates: any) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    toast({
      title: "User Updated",
      description: "User information has been updated.",
    });
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    toast({
      title: "User Removed",
      description: "User has been removed from the team.",
    });
  };

  const handleConfirmTrade = (myScheduleId: string, theirScheduleId: string, tradingWithUserId: string) => {
    if (!activeMcpId) {
      toast({
        title: "No Active User Selected", 
        description: "Please select an Active User to perform trades.",
        variant: "destructive"
      });
      return;
    }

    // Find the schedules and users
    const mySchedule = schedules.find(s => s.id === myScheduleId);
    const theirSchedule = schedules.find(s => s.id === theirScheduleId);
    const tradingPartner = users.find(u => u.id === tradingWithUserId);
    const activeUser = users.find(u => u.id === activeMcpId);
    
    if (!mySchedule || !theirSchedule || !tradingPartner || !activeUser) return;

    // Swap the schedules
    setSchedules(prev => prev.map(schedule => {
      if (schedule.id === myScheduleId) {
        return { ...schedule, userId: tradingWithUserId, userName: tradingPartner.name };
      }
      if (schedule.id === theirScheduleId) {
        return { ...schedule, userId: activeMcpId, userName: activeUser.name };
      }
      return schedule;
    }));

    toast({
      title: "Trade Confirmed",
      description: `You have successfully traded shifts with ${tradingPartner.name}.`,
    });
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link Copied",
      description: "Share link has been copied to clipboard.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
        onExportPDF={handleExportPDF}
        onShare={handleShare}
        onSettings={handleSettings}
        isAdmin={true}
      />

      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="table" className="space-y-6">
          <TabsList className="bg-red-50">
            <TabsTrigger value="table" data-testid="tab-table">Table View</TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="trades" data-testid="tab-trades">Shift Trades</TabsTrigger>
            <TabsTrigger value="team" data-testid="tab-team">Team</TabsTrigger>
            <TabsTrigger value="admin" data-testid="tab-admin">Admin</TabsTrigger>
          </TabsList>

          {/* Active User Selection and Month Picker */}
          <div className="flex items-center space-x-6 pt-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Active User:</label>
              <select 
                value={activeMcpId || ''} 
                onChange={(e) => handleActiveMcpChange(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-red-50 text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-48"
                data-testid="select-active-user"
              >
              <option value="">Select Active User</option>
              
              {/* MCPs (Physicians) Section */}
              {users.filter(user => user.role === 'physician').map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
              
              {/* Learners Section */}
              {users.filter(user => user.role === 'learner').length > 0 && (
                <option disabled>───── LEARNERS ─────</option>
              )}
              {users.filter(user => user.role === 'learner').map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Month/Year:</label>
              <select 
                value={currentMonth} 
                onChange={(e) => handleMonthChange(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-red-50 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="select-month"
              >
                {[
                  "January 2024", "February 2024", "March 2024", "April 2024",
                  "May 2024", "June 2024", "July 2024", "August 2024",
                  "September 2024", "October 2024", "November 2024", "December 2024"
                ].map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>

          <TabsContent value="table" className="space-y-6">
            <TableView 
              currentDate={new Date(selectedYear, selectedMonth - 1, 1)}
              schedules={schedules}
              users={users}
              activeMcpId={activeMcpId}
              onDayClick={handleDayClick}
            />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarGrid 
              month={selectedMonth}
              year={selectedYear}
              schedules={schedules}
              users={users}
              currentUserId={activeMcpId || ''}
              onDayClick={handleDayClick}
            />
          </TabsContent>

          <TabsContent value="trades" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Shift Trading</h2>
                <p className="text-muted-foreground">Confirm shifts you've already agreed to trade with colleagues</p>
              </div>
              <ConfirmTradeDialog 
                users={users}
                schedules={schedules.map(s => ({ ...s, month: 1, year: 2024 }))}
                currentUserId={activeMcpId || ''}
                onConfirmTrade={handleConfirmTrade}
              />
            </div>

            {/* Recent Trades */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Trades</h3>
              <div className="text-center py-8 text-muted-foreground">
                No recent trades. Use "Confirm Trade" above to execute agreed-upon shift swaps.
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <UserManagement 
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              isAdmin={true}
            />
          </TabsContent>

          <TabsContent value="admin">
              <AdminPanel 
                users={users}
                schedules={schedules}
                monthlySettings={monthlySettings}
                onUpdateUserLimit={(id, limit) => handleUpdateUser(id, { monthlyShiftLimit: limit })}
                onUpdatePublishStatus={(isPublished) => setMonthlySettings(prev => ({ ...prev, isPublished }))}
                onGenerateShareLink={() => console.log('Generate share link')}
                onSaveSettings={() => toast({ title: "Settings Saved", description: "Admin settings have been updated." })}
              />
            </TabsContent>
        </Tabs>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Schedule with Stakeholders</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Share this simple link for view-only access to {currentMonth}:
              </p>
              <div className="bg-accent/10 p-4 rounded-md">
                <div className="text-lg font-medium text-primary mb-2">
                  {shareLink}
                </div>
                <p className="text-xs text-muted-foreground">
                  Read-only • No login required
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={copyShareLink} className="flex-1" data-testid="button-copy-link">
                <Share className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShareDialogOpen(false)}
                data-testid="button-close-share"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}