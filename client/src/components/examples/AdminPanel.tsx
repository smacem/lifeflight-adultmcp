import AdminPanel from '../AdminPanel';

export default function AdminPanelExample() {
  // TODO: remove mock data
  const mockUsers = [
    { id: '1', name: 'Dr. Sarah Smith', role: 'physician' as const, monthlyShiftLimit: 8, currentShiftCount: 3 },
    { id: '2', name: 'Dr. Michael Johnson', role: 'physician' as const, monthlyShiftLimit: 8, currentShiftCount: 5 },
    { id: '3', name: 'Dr. Emily Chen', role: 'physician' as const, monthlyShiftLimit: 6, currentShiftCount: 6 },
    { id: '4', name: 'Medical Student Alex', role: 'learner' as const, monthlyShiftLimit: 4, currentShiftCount: 2 },
    { id: '5', name: 'Resident Taylor', role: 'learner' as const, monthlyShiftLimit: 6, currentShiftCount: 4 },
  ];

  const mockMonthlySettings = {
    month: 1,
    year: 2024,
    isPublished: true,
    publicShareToken: 'abc123def456'
  };

  const handleUpdateUserLimit = (userId: string, newLimit: number) => {
    console.log('Updating user limit:', userId, newLimit);
  };

  const handleUpdatePublishStatus = (isPublished: boolean) => {
    console.log('Updating publish status:', isPublished);
  };

  const handleGenerateShareLink = () => {
    console.log('Generating new share link');
  };

  const handleSaveSettings = () => {
    console.log('Saving settings');
  };

  return (
    <AdminPanel 
      users={mockUsers}
      monthlySettings={mockMonthlySettings}
      onUpdateUserLimit={handleUpdateUserLimit}
      onUpdatePublishStatus={handleUpdatePublishStatus}
      onGenerateShareLink={handleGenerateShareLink}
      onSaveSettings={handleSaveSettings}
    />
  );
}