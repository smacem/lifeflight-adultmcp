import PublicScheduleView from '../PublicScheduleView';

export default function PublicScheduleViewExample() {
  // TODO: remove mock data
  const mockUsers = [
    { id: '1', name: 'Dr. Sarah Smith', phone: '555-0101', role: 'physician' as const },
    { id: '2', name: 'Dr. Michael Johnson', phone: '555-0102', role: 'physician' as const },
    { id: '3', name: 'Dr. Emily Chen', phone: '555-0103', role: 'physician' as const },
    { id: '4', name: 'Medical Student Alex', phone: '555-0201', role: 'learner' as const },
    { id: '5', name: 'Resident Taylor', phone: '555-0202', role: 'learner' as const },
  ];

  // TODO: remove mock data
  const mockSchedules = [
    { id: 's1', day: 1, userId: '1', userName: 'Dr. Sarah Smith', userRole: 'physician' as const },
    { id: 's2', day: 3, userId: '2', userName: 'Dr. Michael Johnson', userRole: 'physician' as const },
    { id: 's3', day: 5, userId: '4', userName: 'Medical Student Alex', userRole: 'learner' as const },
    { id: 's4', day: 7, userId: '1', userName: 'Dr. Sarah Smith', userRole: 'physician' as const },
    { id: 's5', day: 10, userId: '3', userName: 'Dr. Emily Chen', userRole: 'physician' as const },
    { id: 's6', day: 12, userId: '5', userName: 'Resident Taylor', userRole: 'learner' as const },
    { id: 's7', day: 15, userId: '2', userName: 'Dr. Michael Johnson', userRole: 'physician' as const },
    { id: 's8', day: 18, userId: '1', userName: 'Dr. Sarah Smith', userRole: 'physician' as const },
    { id: 's9', day: 20, userId: '4', userName: 'Medical Student Alex', userRole: 'learner' as const },
    { id: 's10', day: 22, userId: '3', userName: 'Dr. Emily Chen', userRole: 'physician' as const },
    { id: 's11', day: 25, userId: '5', userName: 'Resident Taylor', userRole: 'learner' as const },
    { id: 's12', day: 28, userId: '2', userName: 'Dr. Michael Johnson', userRole: 'physician' as const },
  ];

  const handleExportPDF = () => {
    console.log('Exporting public schedule to PDF');
  };

  return (
    <PublicScheduleView 
      month={1}
      year={2024}
      schedules={mockSchedules}
      users={mockUsers}
      onExportPDF={handleExportPDF}
    />
  );
}