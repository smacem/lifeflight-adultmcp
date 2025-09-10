import CalendarGrid from '../CalendarGrid';

export default function CalendarGridExample() {
  // TODO: remove mock data
  const mockUsers = [
    { id: '1', name: 'Dr. Smith', phone: '555-0101', role: 'physician' as const, monthlyShiftLimit: 8, currentShiftCount: 3 },
    { id: '2', name: 'Dr. Johnson', phone: '555-0102', role: 'physician' as const, monthlyShiftLimit: 8, currentShiftCount: 5 },
    { id: '3', name: 'Med Student A', phone: '555-0103', role: 'learner' as const, monthlyShiftLimit: 4, currentShiftCount: 2 },
  ];

  // TODO: remove mock data
  const mockSchedules = [
    { id: 's1', day: 1, userId: '1', userName: 'Dr. Smith', userRole: 'physician' as const, status: 'scheduled' as const },
    { id: 's2', day: 3, userId: '2', userName: 'Dr. Johnson', userRole: 'physician' as const, status: 'scheduled' as const },
    { id: 's3', day: 5, userId: '3', userName: 'Med Student A', userRole: 'learner' as const, status: 'scheduled' as const },
    { id: 's4', day: 7, userId: '1', userName: 'Dr. Smith', userRole: 'physician' as const, status: 'scheduled' as const },
    { id: 's5', day: 10, userId: '2', userName: 'Dr. Johnson', userRole: 'physician' as const, status: 'scheduled' as const },
  ];

  const handleDayClick = (day: number) => {
    console.log('Day clicked:', day);
  };

  const handleTradeRequest = (scheduleId: string) => {
    console.log('Trade request for schedule:', scheduleId);
  };

  return (
    <CalendarGrid 
      month={1}
      year={2024}
      schedules={mockSchedules}
      users={mockUsers}
      currentUserId="1"
      onDayClick={handleDayClick}
      onTradeRequest={handleTradeRequest}
    />
  );
}