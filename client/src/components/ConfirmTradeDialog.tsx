import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  name: string;
  role: 'physician' | 'learner';
}

interface Schedule {
  id: string;
  day: number;
  month: number;
  year: number;
  userId: string;
  userName: string;
}

interface ConfirmTradeDialogProps {
  users: User[];
  schedules: Schedule[];
  currentUserId: string;
  onConfirmTrade: (myScheduleId: string, theirScheduleId: string, tradingWithUserId: string) => void;
}

export default function ConfirmTradeDialog({
  users,
  schedules,
  currentUserId,
  onConfirmTrade
}: ConfirmTradeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMySchedule, setSelectedMySchedule] = useState("");
  const [selectedTradingPartner, setSelectedTradingPartner] = useState("");
  const [selectedTheirSchedule, setSelectedTheirSchedule] = useState("");

  const mySchedules = schedules.filter(s => s.userId === currentUserId);
  const otherUsers = users.filter(u => u.id !== currentUserId);
  const tradingPartnerSchedules = schedules.filter(s => s.userId === selectedTradingPartner);

  const handleConfirmTrade = () => {
    if (selectedMySchedule && selectedTheirSchedule && selectedTradingPartner) {
      onConfirmTrade(selectedMySchedule, selectedTheirSchedule, selectedTradingPartner);
      setSelectedMySchedule("");
      setSelectedTheirSchedule("");
      setSelectedTradingPartner("");
      setIsOpen(false);
    }
  };

  const resetForm = () => {
    setSelectedMySchedule("");
    setSelectedTheirSchedule("");
    setSelectedTradingPartner("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button data-testid="button-confirm-trade">
          <ArrowRightLeft className="w-4 h-4 mr-2" />
          Confirm Trade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Shift Trade</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use this to confirm a trade that you have already agreed upon with a colleague.
          </p>
          
          <div>
            <label className="text-sm font-medium">Your Shift to Give</label>
            <Select value={selectedMySchedule} onValueChange={setSelectedMySchedule}>
              <SelectTrigger data-testid="select-my-shift-trade">
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
            <label className="text-sm font-medium">Trading With</label>
            <Select 
              value={selectedTradingPartner} 
              onValueChange={(value) => {
                setSelectedTradingPartner(value);
                setSelectedTheirSchedule(""); // Reset their schedule when partner changes
              }}
            >
              <SelectTrigger data-testid="select-trading-partner">
                <SelectValue placeholder="Select colleague" />
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

          {selectedTradingPartner && (
            <div>
              <label className="text-sm font-medium">Their Shift to Receive</label>
              <Select value={selectedTheirSchedule} onValueChange={setSelectedTheirSchedule}>
                <SelectTrigger data-testid="select-their-shift-trade">
                  <SelectValue placeholder="Select their shift" />
                </SelectTrigger>
                <SelectContent>
                  {tradingPartnerSchedules.map(schedule => (
                    <SelectItem key={schedule.id} value={schedule.id}>
                      {format(new Date(schedule.year, schedule.month - 1, schedule.day), 'EEEE, MMMM dd, yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedMySchedule && selectedTheirSchedule && selectedTradingPartner && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Trade Summary:</div>
              <div className="text-sm text-muted-foreground">
                You give: {(() => {
                  const mySchedule = mySchedules.find(s => s.id === selectedMySchedule);
                  return mySchedule ? format(new Date(mySchedule.year, mySchedule.month - 1, mySchedule.day), 'MMM dd') : '';
                })()}
                <br />
                You receive: {(() => {
                  const theirSchedule = tradingPartnerSchedules.find(s => s.id === selectedTheirSchedule);
                  return theirSchedule ? format(new Date(theirSchedule.year, theirSchedule.month - 1, theirSchedule.day), 'MMM dd') : '';
                })()}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmTrade}
            disabled={!selectedMySchedule || !selectedTheirSchedule || !selectedTradingPartner}
            data-testid="button-execute-trade"
          >
            Execute Trade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}