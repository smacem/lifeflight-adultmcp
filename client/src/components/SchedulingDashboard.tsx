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

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date(2024, 0, 1); // January 2024
    const daysInMonth = new Date(2024, 1, 0).getDate(); // Get days in January
    
    // Add header
    doc.setFontSize(16);
    doc.text('EHS LifeFlight Adult MCP Schedule', 20, 20);
    doc.setFontSize(12);
    doc.text(currentMonth, 20, 35);
    
    // Table headers
    const startY = 50;
    const dayColX = 20;
    const mcpColX = 50;
    const learnerColX = 120;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Day', dayColX, startY);
    doc.text('MCP (Physician)', mcpColX, startY);
    doc.text('Learner', learnerColX, startY);
    
    // Draw header line
    doc.line(15, startY + 2, 190, startY + 2);
    
    // Table data
    doc.setFont('helvetica', 'normal');
    let currentY = startY + 10;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const mcpSchedule = schedules.find(s => s.day === day && s.userRole === 'physician');
      const learnerSchedule = schedules.find(s => s.day === day && s.userRole === 'learner');
      
      // Day number
      doc.text(day.toString(), dayColX, currentY);
      
      // MCP column
      if (mcpSchedule) {
        const mcpUser = users.find(u => u.id === mcpSchedule.userId);
        doc.text(mcpSchedule.userName, mcpColX, currentY);
        if (mcpUser?.phone) {
          doc.setFontSize(8);
          doc.text(mcpUser.phone, mcpColX, currentY + 4);
          doc.setFontSize(10);
        }
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text('Available', mcpColX, currentY);
        doc.setTextColor(0, 0, 0);
      }
      
      // Learner column
      if (learnerSchedule) {
        const learnerUser = users.find(u => u.id === learnerSchedule.userId);
        doc.text(learnerSchedule.userName, learnerColX, currentY);
        if (learnerUser?.phone) {
          doc.setFontSize(8);
          doc.text(learnerUser.phone, learnerColX, currentY + 4);
          doc.setFontSize(10);
        }
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text('Available', learnerColX, currentY);
        doc.setTextColor(0, 0, 0);
      }
      
      currentY += (mcpSchedule?.userName || learnerSchedule?.userName) ? 12 : 8;
      
      // Add new page if needed
      if (currentY > 270) {
        doc.addPage();
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
        isAdmin={activeMcpId ? users.find(u => u.id === activeMcpId)?.role === 'physician' : false}
      />

      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="table" className="space-y-6">
          <TabsList>
            <TabsTrigger value="table" data-testid="tab-table">Table View</TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="trades" data-testid="tab-trades">Shift Trades</TabsTrigger>
            <TabsTrigger value="team" data-testid="tab-team">Team</TabsTrigger>
            {activeMcpId && users.find(u => u.id === activeMcpId)?.role === 'physician' && (
              <TabsTrigger value="admin" data-testid="tab-admin">Admin</TabsTrigger>
            )}
          </TabsList>

          {/* Active User Selection - moved below tabs */}
          <div className="flex items-center space-x-2 pt-2">
            <label className="text-sm font-medium">Active User:</label>
            <select 
              value={activeMcpId || ''} 
              onChange={(e) => handleActiveMcpChange(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-48"
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

          <TabsContent value="table" className="space-y-6">
            <TableView 
              currentDate={new Date(2024, 0, 1)}
              schedules={schedules}
              users={users}
              activeMcpId={activeMcpId}
              onDayClick={handleDayClick}
            />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarGrid 
              month={1}
              year={2024}
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
              isAdmin={activeMcpId ? users.find(u => u.id === activeMcpId)?.role === 'physician' : false}
            />
          </TabsContent>

          {activeMcpId && users.find(u => u.id === activeMcpId)?.role === 'physician' && (
            <TabsContent value="admin">
              <AdminPanel 
                users={users}
                monthlySettings={monthlySettings}
                onUpdateUserLimit={(id, limit) => handleUpdateUser(id, { monthlyShiftLimit: limit })}
                onUpdatePublishStatus={(isPublished) => setMonthlySettings(prev => ({ ...prev, isPublished }))}
                onGenerateShareLink={() => console.log('Generate share link')}
                onSaveSettings={() => toast({ title: "Settings Saved", description: "Admin settings have been updated." })}
              />
            </TabsContent>
          )}
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