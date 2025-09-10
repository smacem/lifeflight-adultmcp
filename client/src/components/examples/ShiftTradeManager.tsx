import ShiftTradeManager from '../ShiftTradeManager';

export default function ShiftTradeManagerExample() {
  // TODO: remove mock data
  const mockTradeRequests = [
    {
      id: 'tr1',
      fromUserId: '1',
      fromUserName: 'Dr. Smith',
      toUserId: '2',
      toUserName: 'Dr. Johnson',
      scheduleId: 's1',
      shiftDate: new Date(2024, 0, 15),
      status: 'pending' as const,
      requestedAt: new Date(2024, 0, 10),
    },
    {
      id: 'tr2',
      fromUserId: '3',
      fromUserName: 'Dr. Chen',
      toUserId: '1',
      toUserName: 'Dr. Smith',
      scheduleId: 's2',
      shiftDate: new Date(2024, 0, 20),
      status: 'pending' as const,
      requestedAt: new Date(2024, 0, 12),
    }
  ];

  const mockUsers = [
    { id: '1', name: 'Dr. Smith', role: 'physician' as const },
    { id: '2', name: 'Dr. Johnson', role: 'physician' as const },
    { id: '3', name: 'Dr. Chen', role: 'physician' as const },
    { id: '4', name: 'Med Student Alex', role: 'learner' as const },
  ];

  const mockSchedules = [
    { id: 's1', day: 15, month: 1, year: 2024, userId: '1', userName: 'Dr. Smith' },
    { id: 's2', day: 20, month: 1, year: 2024, userId: '1', userName: 'Dr. Smith' },
    { id: 's3', day: 25, month: 1, year: 2024, userId: '1', userName: 'Dr. Smith' },
  ];

  const handleApproveTradeRequest = (tradeId: string) => {
    console.log('Approving trade request:', tradeId);
  };

  const handleRejectTradeRequest = (tradeId: string) => {
    console.log('Rejecting trade request:', tradeId);
  };

  const handleCreateTradeRequest = (fromUserId: string, toUserId: string, scheduleId: string) => {
    console.log('Creating trade request:', { fromUserId, toUserId, scheduleId });
  };

  return (
    <ShiftTradeManager 
      tradeRequests={mockTradeRequests}
      users={mockUsers}
      currentUserId="1"
      onApproveTradeRequest={handleApproveTradeRequest}
      onRejectTradeRequest={handleRejectTradeRequest}
      onCreateTradeRequest={handleCreateTradeRequest}
      schedules={mockSchedules}
    />
  );
}