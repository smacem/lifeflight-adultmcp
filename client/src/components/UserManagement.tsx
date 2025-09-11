import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Plus, Phone, User } from "lucide-react";

interface UserFormData {
  name: string;
  phone: string;
  role: 'physician' | 'learner' | 'admin';
  monthlyShiftLimit: number;
  isActive: boolean;
}

interface UserFormProps {
  formData: UserFormData;
  setFormData: (data: UserFormData) => void;
}

// Extract UserForm as a separate component to prevent re-creation and focus loss
const UserForm = ({ formData, setFormData }: UserFormProps) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="name">Name</Label>
      <Input
        id="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Dr. Smith"
        data-testid="input-user-name"
      />
    </div>
    
    <div>
      <Label htmlFor="phone">Phone Number</Label>
      <Input
        id="phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="555-0123"
        data-testid="input-user-phone"
      />
    </div>

    <div>
      <Label htmlFor="role">Role</Label>
      <Select value={formData.role} onValueChange={(value: 'physician' | 'learner' | 'admin') => setFormData({ ...formData, role: value })}>
        <SelectTrigger data-testid="select-user-role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="physician">Physician</SelectItem>
          <SelectItem value="learner">Learner</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div>
      <Label htmlFor="shiftLimit">Monthly Shift Limit</Label>
      <Input
        id="shiftLimit"
        type="number"
        value={formData.monthlyShiftLimit}
        onChange={(e) => setFormData({ ...formData, monthlyShiftLimit: parseInt(e.target.value) || 0 })}
        data-testid="input-shift-limit"
      />
    </div>
  </div>
);

interface User {
  id: string;
  name: string;
  phone: string;
  role: 'physician' | 'learner' | 'admin';
  monthlyShiftLimit: number;
  isActive: boolean;
  currentShiftCount: number;
}

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id' | 'currentShiftCount'>) => void;
  onUpdateUser: (id: string, updates: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  isAdmin?: boolean;
}

export default function UserManagement({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  isAdmin = false
}: UserManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'physician' as 'physician' | 'learner' | 'admin',
    monthlyShiftLimit: 8,
    isActive: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      role: 'physician',
      monthlyShiftLimit: 8,
      isActive: true
    });
  };

  const handleAddUser = () => {
    onAddUser(formData);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      phone: user.phone,
      role: user.role,
      monthlyShiftLimit: user.monthlyShiftLimit,
      isActive: user.isActive
    });
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      onUpdateUser(editingUser.id, formData);
      setEditingUser(null);
      resetForm();
    }
  };

  const physicians = users.filter(u => u.role === 'physician');
  const learners = users.filter(u => u.role === 'learner');

  const UserCard = ({ user }: { user: User }) => (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{user.name}</span>
          </div>
          <Badge variant={user.role === 'physician' ? 'default' : 'secondary'}>
            {user.role}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
          <Phone className="w-3 h-3" />
          <span>{user.phone}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Shifts: {user.currentShiftCount}/{user.monthlyShiftLimit}
          </span>
          <div className="flex space-x-1">
            {isAdmin && (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleEditUser(user)}
                  data-testid={`button-edit-${user.id}`}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => onDeleteUser(user.id)}
                  data-testid={`button-delete-${user.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Team Management</h2>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-user">
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
              </DialogHeader>
              <UserForm formData={formData} setFormData={setFormData} />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} data-testid="button-save-user">
                  Add Member
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Physicians Section */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <h3 className="text-lg font-semibold">Physicians</h3>
          <Badge variant="outline">{physicians.length}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {physicians.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      </div>

      {/* Learners Section */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <h3 className="text-lg font-semibold">Learners</h3>
          <Badge variant="outline">{learners.length}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {learners.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          <UserForm formData={formData} setFormData={setFormData} />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} data-testid="button-update-user">
              Update Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}