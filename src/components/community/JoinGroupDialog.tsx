import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface JoinGroupDialogProps {
  onSuccess: () => void;
}

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
}

export const JoinGroupDialog = ({ onSuccess }: JoinGroupDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (open) {
      fetchAvailableGroups();
    }
  }, [open]);

  const fetchAvailableGroups = async () => {
    const { data, error } = await supabase
      .from('community_groups')
      .select(`
        id,
        name,
        description,
        category,
        group_members(count)
      `)
      .eq('is_private', false);

    if (!error && data) {
      // Get groups user is not already a member of
      const { data: memberData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user?.id);

      const memberGroupIds = memberData?.map(m => m.group_id) || [];
      
      const availableGroups = data
        .filter(group => !memberGroupIds.includes(group.id))
        .map(group => ({
          ...group,
          member_count: (group.group_members as any)?.[0]?.count || 0
        }));
      
      setGroups(availableGroups as any);
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;

    setLoading(true);
    
    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
      });

    if (error) {
      toast.error("Failed to join group");
    } else {
      toast.success("Successfully joined group!");
      fetchAvailableGroups();
      onSuccess();
    }
    
    setLoading(false);
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || group.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'condition_support': return 'Condition Support';
      case 'wellness_challenge': return 'Wellness Challenge';
      case 'local_group': return 'Local Group';
      case 'family_circle': return 'Family Circle';
      default: return category;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Find Groups
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Join a Community Group</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Groups</Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or description..."
              />
            </div>
            <div className="w-48">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="condition_support">Condition Support</SelectItem>
                  <SelectItem value="wellness_challenge">Wellness Challenge</SelectItem>
                  <SelectItem value="local_group">Local Group</SelectItem>
                  <SelectItem value="family_circle">Family Circle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No groups found</h3>
                <p className="text-muted-foreground">Try adjusting your search or create a new group.</p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <Card key={group.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{group.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryLabel(group.category)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{group.member_count} members</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => joinGroup(group.id)}
                        disabled={loading}
                        className="ml-4"
                      >
                        Join
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};