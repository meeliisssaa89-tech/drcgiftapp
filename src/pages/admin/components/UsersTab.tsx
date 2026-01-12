import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Ban, Search, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface AdminUser {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  crystals: number;
  level: number;
  experience: number;
  created_at: string;
}

interface UsersTabProps {
  users: AdminUser[];
  onUpdateCrystals: (userId: string, crystals: number) => Promise<boolean>;
  onUpdateLevel: (userId: string, level: number, experience: number) => Promise<boolean>;
  onBanUser: (userId: string) => Promise<boolean>;
}

export const UsersTab = ({ users, onUpdateCrystals, onUpdateLevel, onBanUser }: UsersTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editMode, setEditMode] = useState<'crystals' | 'level'>('crystals');
  const [newValue, setNewValue] = useState('');
  const [newLevel, setNewLevel] = useState('');
  const [newExp, setNewExp] = useState('');

  const filteredUsers = users.filter(u => 
    (u.username?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    u.telegram_id.toString().includes(searchTerm)
  );

  const handleEditCrystals = (user: AdminUser) => {
    setEditingUser(user);
    setEditMode('crystals');
    setNewValue(user.crystals.toString());
  };

  const handleEditLevel = (user: AdminUser) => {
    setEditingUser(user);
    setEditMode('level');
    setNewLevel(user.level.toString());
    setNewExp(user.experience.toString());
  };

  const handleSave = async () => {
    if (!editingUser) return;
    
    if (editMode === 'crystals') {
      const crystals = parseInt(newValue);
      if (isNaN(crystals) || crystals < 0) return;
      await onUpdateCrystals(editingUser.id, crystals);
    } else {
      const level = parseInt(newLevel);
      const exp = parseInt(newExp);
      if (isNaN(level) || level < 1 || isNaN(exp) || exp < 0) return;
      await onUpdateLevel(editingUser.id, level, exp);
    }
    setEditingUser(null);
  };

  const handleBan = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to reset ${user.first_name || user.username || 'this user'}?`)) return;
    await onBanUser(user.id);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-lg">Users ({filteredUsers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">User</th>
                <th className="text-left p-3 text-sm font-medium">Telegram ID</th>
                <th className="text-left p-3 text-sm font-medium">Level</th>
                <th className="text-left p-3 text-sm font-medium">Crystals</th>
                <th className="text-left p-3 text-sm font-medium">Joined</th>
                <th className="text-left p-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm">
                        {(u.first_name || u.username || 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {u.first_name || u.username || 'Unknown'}
                        </p>
                        {u.username && (
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{u.telegram_id}</td>
                  <td className="p-3">
                    <button 
                      onClick={() => handleEditLevel(u)}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      Lvl. {u.level} ({u.experience} XP)
                    </button>
                  </td>
                  <td className="p-3">
                    <button 
                      onClick={() => handleEditCrystals(u)}
                      className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
                    >
                      {u.crystals.toLocaleString()} 💎
                    </button>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEditCrystals(u)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleBan(u)}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode === 'crystals' ? 'Edit User Crystals' : 'Edit User Level'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editMode === 'crystals' ? (
              <div className="space-y-2">
                <Label>Crystals Amount</Label>
                <Input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  min="0"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Input
                    type="number"
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Experience</Label>
                  <Input
                    type="number"
                    value={newExp}
                    onChange={(e) => setNewExp(e.target.value)}
                    min="0"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
