import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "./Header";
import CalendarGrid from "./CalendarGrid";
import TableView from "./TableView";
import UserManagement from "./UserManagement";
import AdminPanel from "./AdminPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Share } from 'lucide-react';
import jsPDF from 'jspdf';
import logoImage from "@assets/IMG_4131_1757550683322.png";
import { apiRequest } from "@/lib/queryClient";
import type { User, Schedule } from "@shared/schema";

export default function SchedulingDashboard() {
  // Initialize with current month
  const getCurrentMonth = () => {
    const now = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  };

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const queryClient = useQueryClient();
  const [activeMcpId, setActiveMcpId] = useState<string>("");
  
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
  
  // Fetch users with proper typing
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch schedules for current month with proper typing
  const { data: apiSchedules = [], isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/schedules?month=${selectedMonth}&year=${selectedYear}`);
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Transform API schedules to match frontend format
  const schedules = apiSchedules.map((schedule: Schedule) => {
    const user = users.find((u: User) => u.id === schedule.userId);
    const userRole = user?.role === 'admin' ? 'physician' : (user?.role || 'physician');
    return {
      id: schedule.id,
      day: schedule.day,
      userId: schedule.userId,
      userName: user?.name || 'Unknown User',
      userRole: userRole as 'physician' | 'learner',
      status: schedule.status
    };
  });


  // User management mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('POST', '/api/users', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string, userData: any }) => {
      const response = await apiRequest('PUT', `/api/users/${id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    }
  });
  
  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: { month: number; year: number; day: number; userId: string }) => {
      const response = await apiRequest('POST', '/api/schedules', scheduleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
  });


  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const response = await apiRequest('DELETE', `/api/schedules/${scheduleId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
  });
  
  // Fetch monthly settings for current month
  const { data: fetchedMonthlySettings } = useQuery({
    queryKey: ['/api/monthly-settings', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/monthly-settings?month=${selectedMonth}&year=${selectedYear}`);
      return response.json();
    },
  });

  // Monthly settings mutation
  const updateMonthlySettingsMutation = useMutation({
    mutationFn: async (settings: { month: number; year: number; isPublished?: boolean; publicShareToken?: string }) => {
      const response = await apiRequest('PUT', '/api/monthly-settings', settings);
      return response.json();
    },
    onSuccess: (data) => {
      setMonthlySettings(data);
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-settings'] });
      
      // Show the new link to user if a token was generated
      if (data.publicShareToken) {
        const newShareLink = `${window.location.origin}/public/${data.publicShareToken}`;
        setShareLink(newShareLink);
        setShareDialogOpen(true);
      }
    },
  });
  
  // Use fetched settings or fallback to defaults
  const [monthlySettings, setMonthlySettings] = useState({
    month: selectedMonth,
    year: selectedYear,
    isPublished: false,
    publicShareToken: undefined
  });

  // Update local state when fetched settings change
  useEffect(() => {
    if (fetchedMonthlySettings) {
      setMonthlySettings(fetchedMonthlySettings);
    }
  }, [fetchedMonthlySettings]);

  // Note: Approval/rejection functions removed since trades are now immediate

  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
    console.log('Month changed to:', month);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    
    // ===============================
    // COMPLETE PDF REBUILD - CLEAN START
    // ===============================
    
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
    doc.text(currentMonth, 50, 30);
    
    // ===============================
    // TABLE LAYOUT - CLEAN DEFINITIONS
    // ===============================
    
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
    const AVAILABLE_HEIGHT = 210; // Space available for table content
    const ROW_HEIGHT = Math.max(6, Math.floor((AVAILABLE_HEIGHT - HEADER_HEIGHT) / daysInMonth)); // Dynamic row height
    const TABLE_HEIGHT = HEADER_HEIGHT + (daysInMonth * ROW_HEIGHT);
    
    // ===============================
    // DRAW TABLE STRUCTURE
    // ===============================
    
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
    
    // ===============================
    // HELPER FUNCTION: CENTER TEXT
    // ===============================
    
    const centerText = (text: string, centerX: number, y: number) => {
      const textWidth = doc.getTextWidth(text);
      const leftX = centerX - (textWidth / 2);
      doc.text(text, leftX, y);
    };
    
    // ===============================
    // HEADERS
    // ===============================
    
    const HEADER_Y = TABLE_START_Y + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    centerText('Day', COL_DAY_CENTER, HEADER_Y);
    centerText('MCP (Physician)', COL_MCP_CENTER, HEADER_Y);
    centerText('Learner', COL_LEARNER_CENTER, HEADER_Y);
    
    // ===============================
    // USER COLORS
    // ===============================
    
    const getUserColor = (userId: string, role: string) => {
      if (role === 'physician') {
        const user = users.find((u: User) => u.id === userId);
        if (user?.name.includes('Sarah')) return { r: 34, g: 197, b: 94 };
        if (user?.name.includes('Michael')) return { r: 139, g: 69, b: 19 };
        if (user?.name.includes('Emily')) return { r: 99, g: 102, b: 241 };
        return { r: 0, g: 0, b: 0 };
      }
      return { r: 107, g: 114, b: 128 };
    };
    
    // ===============================
    // TABLE ROWS
    // ===============================
    
    for (let day = 1; day <= daysInMonth; day++) {
      const rowY = TABLE_START_Y + HEADER_HEIGHT + ((day - 1) * ROW_HEIGHT);
      const textY = rowY + (ROW_HEIGHT / 2) + 1; // Better vertical centering
      
      // Row divider (light gray)
      if (day < daysInMonth) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(TABLE_LEFT, rowY + ROW_HEIGHT, TABLE_LEFT + TABLE_WIDTH, rowY + ROW_HEIGHT);
        doc.setDrawColor(0, 0, 0);
      }
      
      // Day number
      doc.setFontSize(Math.min(11, ROW_HEIGHT));
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      centerText(day.toString(), COL_DAY_CENTER, textY);
      
      // MCP column
      const mcpSchedule = schedules.find((s: any) => s.day === day && s.userRole === 'physician');
      if (mcpSchedule) {
        const color = getUserColor(mcpSchedule.userId, 'physician');
        doc.setTextColor(color.r, color.g, color.b);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(Math.min(12, ROW_HEIGHT));
        
        // Get phone number to determine layout
        const mcpUser = users.find((u: User) => u.id === mcpSchedule.userId);
        if (mcpUser?.phone) {
          // Position name and phone side by side
          const nameText = mcpSchedule.userName;
          const phoneText = mcpUser.phone;
          const combinedText = `${nameText} ${phoneText}`;
          
          doc.setTextColor(color.r, color.g, color.b);
          doc.text(nameText, COL_MCP_CENTER - doc.getTextWidth(combinedText)/2, textY);
          
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(Math.min(11, ROW_HEIGHT - 1));
          doc.text(phoneText, COL_MCP_CENTER - doc.getTextWidth(combinedText)/2 + doc.getTextWidth(nameText) + 3, textY);
        } else {
          // Just center the name if no phone
          centerText(mcpSchedule.userName, COL_MCP_CENTER, textY);
        }
      } else {
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(Math.min(9, ROW_HEIGHT - 2));
        centerText('Available', COL_MCP_CENTER, textY);
      }
      
      // Learner column
      const learnerSchedule = schedules.find((s: any) => s.day === day && s.userRole === 'learner');
      if (learnerSchedule) {
        const color = getUserColor(learnerSchedule.userId, 'learner');
        doc.setTextColor(color.r, color.g, color.b);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(Math.min(12, ROW_HEIGHT));
        
        // Get phone number to determine layout
        const learnerUser = users.find((u: User) => u.id === learnerSchedule.userId);
        if (learnerUser?.phone) {
          // Position name and phone side by side
          const nameText = learnerSchedule.userName;
          const phoneText = learnerUser.phone;
          const combinedText = `${nameText} ${phoneText}`;
          
          doc.setTextColor(color.r, color.g, color.b);
          doc.text(nameText, COL_LEARNER_CENTER - doc.getTextWidth(combinedText)/2, textY);
          
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(Math.min(11, ROW_HEIGHT - 1));
          doc.text(phoneText, COL_LEARNER_CENTER - doc.getTextWidth(combinedText)/2 + doc.getTextWidth(nameText) + 3, textY);
        } else {
          // Just center the name if no phone
          centerText(learnerSchedule.userName, COL_LEARNER_CENTER, textY);
        }
      } else {
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(Math.min(9, ROW_HEIGHT - 2));
        centerText('Available', COL_LEARNER_CENTER, textY);
      }
    }
    
    // Save PDF
    doc.save(`EHS-LifeFlight-Schedule-${currentMonth.replace(' ', '-')}.pdf`);
    
    toast({
      title: "PDF Generated",
      description: `Adult MCP Schedule for ${currentMonth} exported successfully.`,
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

  const handleGenerateShareLink = async () => {
    try {
      // Generate a new random token
      const newToken = Math.random().toString(36).substr(2, 16) + Math.random().toString(36).substr(2, 16);
      
      // Update monthly settings with new token
      await updateMonthlySettingsMutation.mutateAsync({
        month: selectedMonth,
        year: selectedYear,
        isPublished: monthlySettings.isPublished,
        publicShareToken: newToken,
      });

      toast({
        title: "New Share Link Generated",
        description: "A new secure share link has been created for stakeholders.",
      });
    } catch (error: any) {
      toast({
        title: "Error Generating Link",
        description: error.message || "Failed to generate new share link. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleActiveMcpChange = (mcpId: string) => {
    setActiveMcpId(mcpId);
    console.log('Active MCP changed to:', mcpId);
  };

  const handleDayClick = async (day: number) => {
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
    const user = users.find((u: User) => u.id === userId);
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
      const existingPhysician = schedules.find((s: any) => s.day === day && s.userRole === 'physician');
      if (existingPhysician && existingPhysician.userId !== userId) {
        const existingUser = users.find((u: User) => u.id === existingPhysician.userId);
        toast({
          title: "Day Locked for MCPs",
          description: `This day is already claimed by MCP ${existingUser?.name || 'another physician'}. Only one MCP per day allowed.`,
          variant: "destructive"
        });
        return;
      }
    } else if (user.role === 'learner') {
      const existingLearner = schedules.find((s: any) => s.day === day && s.userRole === 'learner');
      if (existingLearner && existingLearner.userId !== userId) {
        const existingUser = users.find((u: User) => u.id === existingLearner.userId);
        toast({
          title: "Day Locked for Learners",
          description: `This day is already claimed by learner ${existingUser?.name || 'another learner'}. Only one learner per day allowed.`,
          variant: "destructive"
        });
        return;
      }
    }

    const existingSchedule = schedules.find((s: any) => s.day === day && s.userId === userId);
    
    if (existingSchedule) {
      // Remove the schedule using API
      try {
        await deleteScheduleMutation.mutateAsync(existingSchedule.id);
        toast({
          title: "Shift Removed",
          description: `${user.name} has been removed from ${currentMonth.split(' ')[0]} ${day}.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to remove shift. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      // Check shift limit (this will be enforced by backend but checking here for UX)
      const userShifts = schedules.filter((s: any) => s.userId === userId).length;
      if (userShifts >= user.monthlyShiftLimit) {
        toast({
          title: "Shift Limit Reached",
          description: `${user.name} has reached the monthly limit of ${user.monthlyShiftLimit} shifts.`,
          variant: "destructive"
        });
        return;
      }
      
      // Add the schedule using API
      try {
        await createScheduleMutation.mutateAsync({
          month: selectedMonth,
          year: selectedYear,
          day,
          userId: userId,
        });
        toast({
          title: "Shift Added",
          description: `${user.name} has been scheduled for ${currentMonth.split(' ')[0]} ${day}.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add shift. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleAddUser = async (userData: any) => {
    try {
      await createUserMutation.mutateAsync(userData);
      toast({
        title: "Team Member Added",
        description: `${userData.name} has been successfully added to the team.`,
      });
    } catch (error: any) {
      toast({
        title: "Error Adding Team Member",
        description: error.message || "Failed to add team member. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUser = async (id: string, updates: any) => {
    try {
      await updateUserMutation.mutateAsync({ id, userData: updates });
      toast({
        title: "Team Member Updated",
        description: "Team member information has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error Updating Team Member",
        description: error.message || "Failed to update team member. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUserMutation.mutateAsync(id);
      toast({
        title: "Team Member Removed",
        description: "Team member has been successfully removed from the system.",
      });
    } catch (error: any) {
      toast({
        title: "Error Removing Team Member",
        description: error.message || "Failed to remove team member. Please try again.",
        variant: "destructive"
      });
    }
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
                {(() => {
                  // Generate dynamic month list: current month + prior 2 months + next 6 months
                  const months = [];
                  const now = new Date();
                  const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ];
                  
                  // Start from 2 months ago
                  for (let i = -2; i <= 6; i++) {
                    const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
                    const monthName = monthNames[targetDate.getMonth()];
                    const year = targetDate.getFullYear();
                    months.push(`${monthName} ${year}`);
                  }
                  
                  return months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ));
                })()}
              </select>
            </div>
          </div>

          <TabsContent value="table" className="space-y-6">
            <TableView 
              currentDate={new Date(selectedYear, selectedMonth - 1, 1)}
              schedules={schedules}
              users={users as any}
              activeMcpId={activeMcpId}
              onDayClick={handleDayClick}
            />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarGrid 
              month={selectedMonth}
              year={selectedYear}
              schedules={schedules}
              users={users as any}
              currentUserId={activeMcpId || ''}
              onDayClick={handleDayClick}
            />
          </TabsContent>


          <TabsContent value="team">
            <UserManagement 
              users={users as any}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              isAdmin={true}
            />
          </TabsContent>

          <TabsContent value="admin">
              <AdminPanel 
                users={users as any}
                schedules={schedules}
                monthlySettings={monthlySettings}
                onUpdateUserLimit={(id, limit) => handleUpdateUser(id, { monthlyShiftLimit: limit })}
                onUpdatePublishStatus={(isPublished) => setMonthlySettings(prev => ({ ...prev, isPublished }))}
                onGenerateShareLink={handleGenerateShareLink}
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