import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getDaysInMonth } from "date-fns";
import { MoreHorizontal, RefreshCw, ArrowRightLeft } from "lucide-react";

// Helper function to get consistent color for each user
import { getUserColor } from '@/lib/colors';

interface TableUser {
  id: string;
  name: string;
  phone: string;
  role: 'physician' | 'learner';
  monthlyShiftLimit: number;
  currentShiftCount: number;
}

interface TableSchedule {
  id: string;
  day: number;
  userId: string;
  userName: string;
  userRole: 'physician' | 'learner';
  status: 'scheduled' | 'available' | 'unavailable';
}

interface TableViewProps {
  currentDate: Date;
  users: TableUser[];
  schedules: TableSchedule[];
  currentUserId?: string;
  onDayClick?: (day: number) => void;
  onReassignSchedule?: (scheduleId: string) => void;
  onSwapSchedules?: (scheduleId: string) => void;
  isPublicView?: boolean;
  activeMcpId?: string;
}

export default function TableView({
  currentDate,
  users,
  schedules,
  currentUserId,
  onDayClick,
  onReassignSchedule,
  onSwapSchedules,
  isPublicView = false,
  activeMcpId
}: TableViewProps) {
  const daysInMonth = getDaysInMonth(currentDate);
  
  const getScheduleForDay = (day: number, role: 'physician' | 'learner') => {
    return schedules.find(s => s.day === day && s.userRole === role);
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

  const handleDayClick = (day: number) => {
    if (onDayClick && !isPublicView && activeMcpId) {
      onDayClick(day);
    }
  };

  const renderRows = () => {
    const rows = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const mcpSchedule = getScheduleForDay(day, 'physician');
      const learnerSchedule = getScheduleForDay(day, 'learner');
      const isUserDay = isUserScheduled(day, activeMcpId);
      const canSchedule = canUserSchedule(day, activeMcpId);
      
      rows.push(
        <TableRow 
          key={day}
          className={cn(
            "hover-elevate cursor-pointer",
            isUserDay && "bg-primary/5",
            canSchedule && "hover:bg-muted/50"
          )}
          onClick={() => handleDayClick(day)}
          data-testid={`table-day-${day}`}
        >
          <TableCell className="font-medium text-center w-20">
            <div className="flex items-center justify-center">
              <span className="text-lg">{day}</span>
              {!isPublicView && activeMcpId && (
                <div className="ml-2">
                  {isUserDay && (
                    <div className="w-2 h-2 bg-primary rounded-full" title="You are scheduled"></div>
                  )}
                  {canSchedule && !isUserDay && (
                    <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" title="Available to schedule"></div>
                  )}
                </div>
              )}
            </div>
          </TableCell>
          
          <TableCell className="text-center">
            {mcpSchedule ? (
              <div className="space-y-1">
                <div className="relative group">
                  <Badge className={`w-full justify-center ${getUserColor(mcpSchedule.userId, mcpSchedule.userRole)}`}>
                    {mcpSchedule.userName}
                  </Badge>
                  
                  {/* Trade menu - only show if not public view and handlers exist */}
                  {!isPublicView && (onReassignSchedule || onSwapSchedules) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-1 -right-1 h-4 w-4 opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background border border-border rounded-full shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`trade-menu-mcp-${mcpSchedule.id}`}
                        >
                          <MoreHorizontal className="h-2 w-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {onReassignSchedule && (
                          <>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Open reassignment selection dialog
                                onReassignSchedule(mcpSchedule.id);
                              }}
                              data-testid={`reassign-mcp-${mcpSchedule.id}`}
                            >
                              <RefreshCw className="mr-2 h-3 w-3" />
                              Reassign
                            </DropdownMenuItem>
                          </>
                        )}
                        {onSwapSchedules && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Open swap selection dialog
                                onSwapSchedules(mcpSchedule.id);
                              }}
                              data-testid={`swap-mcp-${mcpSchedule.id}`}
                            >
                              <ArrowRightLeft className="mr-2 h-3 w-3" />
                              Swap
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                {!isPublicView && (
                  <div className="text-xs text-muted-foreground">
                    {users.find(u => u.id === mcpSchedule.userId)?.phone || 'No phone'}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground italic">Available</div>
            )}
          </TableCell>
          
          <TableCell className="text-center">
            {learnerSchedule ? (
              <div className="space-y-1">
                <div className="relative group">
                  <Badge className={`w-full justify-center ${getUserColor(learnerSchedule.userId, learnerSchedule.userRole)}`}>
                    {learnerSchedule.userName}
                  </Badge>
                  
                  {/* Trade menu - only show if not public view and handlers exist */}
                  {!isPublicView && (onReassignSchedule || onSwapSchedules) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-1 -right-1 h-4 w-4 opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background border border-border rounded-full shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`trade-menu-learner-${learnerSchedule.id}`}
                        >
                          <MoreHorizontal className="h-2 w-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {onReassignSchedule && (
                          <>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Open reassignment selection dialog
                                onReassignSchedule(learnerSchedule.id);
                              }}
                              data-testid={`reassign-learner-${learnerSchedule.id}`}
                            >
                              <RefreshCw className="mr-2 h-3 w-3" />
                              Reassign
                            </DropdownMenuItem>
                          </>
                        )}
                        {onSwapSchedules && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Open swap selection dialog
                                onSwapSchedules(learnerSchedule.id);
                              }}
                              data-testid={`swap-learner-${learnerSchedule.id}`}
                            >
                              <ArrowRightLeft className="mr-2 h-3 w-3" />
                              Swap
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {users.find(u => u.id === learnerSchedule.userId)?.phone || 'No phone'}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground italic">Available</div>
            )}
          </TableCell>
        </TableRow>
      );
    }
    
    return rows;
  };

  return (
    <div className="bg-white border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Schedule
        </h2>
        {!isPublicView && activeMcpId && (
          <div className="text-sm text-muted-foreground mt-1">
            {(() => {
              const user = users.find(u => u.id === activeMcpId);
              const userScheduleCount = schedules.filter(s => s.userId === activeMcpId).length;
              return `${userScheduleCount}/${user?.monthlyShiftLimit || 0} shifts selected this month`;
            })()}
          </div>
        )}
      </div>

      <div className="overflow-auto max-h-96">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center w-20">Day</TableHead>
              <TableHead className="text-center">MCP (Physician)</TableHead>
              <TableHead className="text-center">Learner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderRows()}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}