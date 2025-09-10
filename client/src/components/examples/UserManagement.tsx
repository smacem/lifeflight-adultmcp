import UserManagement from '../UserManagement';

export default function UserManagementExample() {
  // TODO: remove mock data
  const mockUsers = [
    { id: '1', name: 'Dr. Sarah Smith', phone: '555-0101', role: 'physician' as const, monthlyShiftLimit: 8, isActive: true, currentShiftCount: 3 },
    { id: '2', name: 'Dr. Michael Johnson', phone: '555-0102', role: 'physician' as const, monthlyShiftLimit: 8, isActive: true, currentShiftCount: 5 },
    { id: '3', name: 'Dr. Emily Chen', phone: '555-0103', role: 'physician' as const, monthlyShiftLimit: 6, isActive: true, currentShiftCount: 2 },
    { id: '4', name: 'Medical Student Alex', phone: '555-0201', role: 'learner' as const, monthlyShiftLimit: 4, isActive: true, currentShiftCount: 2 },
    { id: '5', name: 'Resident Taylor', phone: '555-0202', role: 'learner' as const, monthlyShiftLimit: 6, isActive: true, currentShiftCount: 4 },
  ];

  const handleAddUser = (user: any) => {
    console.log('Adding user:', user);
  };

  const handleUpdateUser = (id: string, updates: any) => {
    console.log('Updating user:', id, updates);
  };

  const handleDeleteUser = (id: string) => {
    console.log('Deleting user:', id);
  };

  return (
    <UserManagement 
      users={mockUsers}
      onAddUser={handleAddUser}
      onUpdateUser={handleUpdateUser}
      onDeleteUser={handleDeleteUser}
      isAdmin={true}
    />
  );
}