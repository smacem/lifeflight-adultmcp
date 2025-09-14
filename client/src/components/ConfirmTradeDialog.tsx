import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft, Gift, HandHeart } from "lucide-react";
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
  onConfirmTrade: (myScheduleId: string, targetUserId: string) => void;
}

export default function ConfirmTradeDialog({
  users,
  schedules,
  currentUserId,
  onConfirmTrade
}: ConfirmTradeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [operationType, setOperationType] = useState<'give' | 'take'>('give');
  const [selectedMySchedule, setSelectedMySchedule] = useState("");
  const [selectedTradingPartner, setSelectedTradingPartner] = useState("");
  const [selectedTheirSchedule, setSelectedTheirSchedule] = useState("");

  const mySchedules = schedules.filter(s => s.userId === currentUserId);
  const otherUsers = users.filter(u => u.id !== currentUserId);
  const tradingPartnerSchedules = schedules.filter(s => s.userId === selectedTradingPartner);

  const handleConfirmTrade = () => {
    const isValidGive = operationType === 'give' && selectedMySchedule && selectedTradingPartner;
    const isValidTake = operationType === 'take' && selectedTheirSchedule && selectedTradingPartner;
    
    if (isValidGive) {
      // Give my schedule to the selected partner
      onConfirmTrade(selectedMySchedule, selectedTradingPartner);
      resetForm();
      setIsOpen(false);
    } else if (isValidTake) {
      // Take their schedule (they lose it, I gain it)
      onConfirmTrade(selectedTheirSchedule, currentUserId);
      resetForm();
      setIsOpen(false);
    }
  };

  const resetForm = () => {
    setSelectedMySchedule("");
    setSelectedTheirSchedule("");
    setSelectedTradingPartner("");
    setOperationType('give');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button data-testid="button-confirm-trade">
          <ArrowRightLeft className="w-4 h-4 mr-2" />
          Execute Trade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Execute Trade</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">Action Type</label>
            <RadioGroup value={operationType} onValueChange={(value: 'give' | 'take') => {
              setOperationType(value);
              // Reset form fields but preserve operation type
              setSelectedMySchedule("");
              setSelectedTheirSchedule("");
              setSelectedTradingPartner("");
            }}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="give" id="give" />
                <Label htmlFor="give" className="flex items-center">
                  <Gift className="w-4 h-4 mr-1" />
                  Give a shift
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="take" id="take" />
                <Label htmlFor="take" className="flex items-center">
                  <HandHeart className="w-4 h-4 mr-1" />
                  Take a shift
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {operationType === 'give' && (
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
          )}

          <div>
            <label className="text-sm font-medium">
              {operationType === 'give' ? 'Give To' : 'Take From'}
            </label>
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

          {selectedTradingPartner && operationType === 'take' && (
            <div>
              <label className="text-sm font-medium">Shift to Take</label>
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

          {((operationType === 'give' && selectedMySchedule && selectedTradingPartner) ||
            (operationType === 'take' && selectedTheirSchedule && selectedTradingPartner)) && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">
                {operationType === 'give' ? 'Give Summary:' : 'Take Summary:'}
              </div>
              <div className="text-sm text-muted-foreground">
                {operationType === 'give' && (
                  <>
                    You give: {(() => {
                      const mySchedule = mySchedules.find(s => s.id === selectedMySchedule);
                      return mySchedule ? format(new Date(mySchedule.year, mySchedule.month - 1, mySchedule.day), 'MMM dd') : '';
                    })()} to {users.find(u => u.id === selectedTradingPartner)?.name}
                  </>
                )}
                {operationType === 'take' && (
                  <>
                    You take: {(() => {
                      const theirSchedule = tradingPartnerSchedules.find(s => s.id === selectedTheirSchedule);
                      return theirSchedule ? format(new Date(theirSchedule.year, theirSchedule.month - 1, theirSchedule.day), 'MMM dd') : '';
                    })()} from {users.find(u => u.id === selectedTradingPartner)?.name}
                  </>
                )}
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
            disabled={
              (operationType === 'give' && (!selectedMySchedule || !selectedTradingPartner)) ||
              (operationType === 'take' && (!selectedTheirSchedule || !selectedTradingPartner))
            }
            data-testid="button-execute-trade"
          >
            {operationType === 'give' ? 'Give Shift' : 'Take Shift'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}