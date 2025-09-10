import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, Check, X, Clock } from "lucide-react";
import { format } from "date-fns";

interface TradeRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  scheduleId: string;
  shiftDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAt: Date;
  respondedAt?: Date;
}

interface User {
  id: string;
  name: string;
  role: 'physician' | 'learner';
}

interface ShiftTradeManagerProps {
  tradeRequests: TradeRequest[];
  users: User[];
  currentUserId: string;
  onApproveTradeRequest: (tradeId: string) => void;
  onRejectTradeRequest: (tradeId: string) => void;
  onCreateTradeRequest: (fromUserId: string, toUserId: string, scheduleId: string) => void;
  schedules: Array<{ id: string; day: number; month: number; year: number; userId: string; userName: string }>;
}

export default function ShiftTradeManager({
  tradeRequests,
  users,
  currentUserId,
  onApproveTradeRequest,
  onRejectTradeRequest,
  onCreateTradeRequest,
  schedules
}: ShiftTradeManagerProps) {
  const [isNewTradeDialogOpen, setIsNewTradeDialogOpen] = useState(false);
  const [selectedTargetUser, setSelectedTargetUser] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState("");

  const pendingRequests = tradeRequests.filter(req => req.status === 'pending');
  const myRequests = tradeRequests.filter(req => req.fromUserId === currentUserId);
  const requestsToMe = tradeRequests.filter(req => req.toUserId === currentUserId && req.status === 'pending');
  const mySchedules = schedules.filter(s => s.userId === currentUserId);
  const otherUsers = users.filter(u => u.id !== currentUserId);

  const handleCreateTrade = () => {
    if (selectedTargetUser && selectedSchedule) {
      onCreateTradeRequest(currentUserId, selectedTargetUser, selectedSchedule);
      setSelectedTargetUser("");
      setSelectedSchedule("");
      setIsNewTradeDialogOpen(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const TradeRequestCard = ({ request, showActions = false }: { request: TradeRequest; showActions?: boolean }) => (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant={getStatusBadgeVariant(request.status)}>
            {request.status}
          </Badge>
          <div className="text-sm text-muted-foreground">
            {format(request.requestedAt, 'MMM dd, yyyy')}
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-3">
          <span className="font-medium">{request.fromUserName}</span>
          <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{request.toUserName}</span>
        </div>

        <div className="text-sm text-muted-foreground mb-3">
          Shift: {format(request.shiftDate, 'EEEE, MMMM dd, yyyy')}
        </div>

        {showActions && request.status === 'pending' && (
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => onApproveTradeRequest(request.id)}
              data-testid={`button-approve-trade-${request.id}`}
            >
              <Check className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onRejectTradeRequest(request.id)}
              data-testid={`button-reject-trade-${request.id}`}
            >
              <X className="w-4 h-4 mr-1" />
              Decline
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Shift Trades</h2>
        <Dialog open={isNewTradeDialogOpen} onOpenChange={setIsNewTradeDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-trade">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Request Trade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Shift Trade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Your Shift to Trade</label>
                <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                  <SelectTrigger data-testid="select-my-shift">
                    <SelectValue placeholder="Select your shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {mySchedules.map(schedule => (
                      <SelectItem key={schedule.id} value={schedule.id}>
                        {format(new Date(schedule.year, schedule.month - 1, schedule.day), 'EEEE, MMMM dd, yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Trade With</label>
                <Select value={selectedTargetUser} onValueChange={setSelectedTargetUser}>
                  <SelectTrigger data-testid="select-target-user">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsNewTradeDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTrade}
                disabled={!selectedTargetUser || !selectedSchedule}
                data-testid="button-create-trade"
              >
                Send Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Requests to me */}
      {requestsToMe.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-lg font-semibold">Requests to You</h3>
            <Badge variant="outline">{requestsToMe.length}</Badge>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requestsToMe.map(request => (
              <TradeRequestCard key={request.id} request={request} showActions={true} />
            ))}
          </div>
        </div>
      )}

      {/* My requests */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <h3 className="text-lg font-semibold">Your Requests</h3>
          <Badge variant="outline">{myRequests.length}</Badge>
        </div>
        {myRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myRequests.map(request => (
              <TradeRequestCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No active trade requests. Use the "Request Trade" button to propose a shift exchange.
          </div>
        )}
      </div>

      {/* All pending requests (for reference) */}
      {pendingRequests.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-lg font-semibold">All Pending Trades</h3>
            <Badge variant="outline">{pendingRequests.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map(request => (
              <TradeRequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}