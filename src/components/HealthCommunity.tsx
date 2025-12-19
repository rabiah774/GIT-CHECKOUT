import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  Heart, 
  Trophy, 
  MapPin,
  Plus,
  ThumbsUp,
  Reply,
  Eye,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CreatePostDialog } from "./community/CreatePostDialog";
import { JoinGroupDialog } from "./community/JoinGroupDialog";
import { CreateEventDialog } from "./community/CreateEventDialog";

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  post_type: string;
  is_anonymous: boolean;
  likes_count: number;
  replies_count: number;
  created_at: string;
  author_name: string;
  group_name?: string;
}

interface HealthEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  event_time: string;
  location: string;
  is_free: boolean;
  cost: number;
  current_participants: number;
  max_participants: number;
  clinic_name?: string;
}

interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
  is_member: boolean;
}

export const HealthCommunity = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCommunityData();
    }
  }, [user]);

  const fetchCommunityData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchPosts(),
        fetchEvents(),
        fetchGroups()
      ]);
    } catch (err) {
      setError('Failed to load community data. Please try again.');
      console.error('Community data fetch error:', err);
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        post_type,
        is_anonymous,
        likes_count,
        replies_count,
        created_at,
        profiles!community_posts_author_id_fkey(full_name),
        community_groups(name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      const formattedPosts = data.map(post => ({
        ...post,
        author_name: post.is_anonymous ? 'Anonymous' : (post.profiles as any)?.full_name || 'Unknown',
        group_name: (post.community_groups as any)?.name
      }));
      setPosts(formattedPosts as any);
    }
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('health_events')
      .select(`
        id,
        title,
        description,
        event_type,
        event_date,
        event_time,
        location,
        is_free,
        cost,
        current_participants,
        max_participants,
        clinics(clinic_name)
      `)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(10);

    if (!error && data) {
      const formattedEvents = data.map(event => ({
        ...event,
        clinic_name: (event.clinics as any)?.clinic_name
      }));
      setEvents(formattedEvents as any);
    }
  };

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('community_groups')
      .select(`
        id,
        name,
        description,
        category,
        group_members(count)
      `)
      .limit(10);

    if (!error && data) {
      // Check which groups user is member of
      const { data: memberData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user?.id);

      const memberGroupIds = memberData?.map(m => m.group_id) || [];

      const formattedGroups = data.map(group => ({
        ...group,
        member_count: (group.group_members as any)?.[0]?.count || 0,
        is_member: memberGroupIds.includes(group.id)
      }));
      setGroups(formattedGroups as any);
    }
  };

  const likePost = async (postId: string) => {
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: user?.id });

    if (!error) {
      toast.success("Post liked!");
      fetchPosts();
    } else {
      toast.error("Already liked or error occurred");
    }
  };

  const joinEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('event_participants')
      .insert({ event_id: eventId, user_id: user?.id });

    if (!error) {
      toast.success("Successfully registered for event!");
      fetchEvents();
    } else {
      toast.error("Already registered or error occurred");
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return <MessageCircle className="w-4 h-4" />;
      case 'story': return <Heart className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'challenge': return <Trophy className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'health_camp': return 'bg-blue-100 text-blue-800';
      case 'vaccination': return 'bg-green-100 text-green-800';
      case 'workshop': return 'bg-purple-100 text-purple-800';
      case 'screening': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading community...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Community Unavailable</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchCommunityData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Health Community</h2>
          <p className="text-muted-foreground">Connect, share, and support each other</p>
        </div>
        <CreatePostDialog onSuccess={fetchPosts} />
      </div>

      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Heart className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900">Welcome to Health Community!</h3>
            <p className="text-sm text-purple-700">Share your health journey, ask questions, and support others in their wellness goals.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts">Recent Posts</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="events">Health Events</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">Be the first to start a conversation!</p>
                <CreatePostDialog onSuccess={fetchPosts} />
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {getPostTypeIcon(post.post_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{post.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {post.post_type}
                        </Badge>
                        {post.group_name && (
                          <Badge variant="secondary" className="text-xs">
                            {post.group_name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        By {post.author_name} • {new Date(post.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm mb-4 line-clamp-3">{post.content}</p>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => likePost(post.id)}
                          className="flex items-center gap-1"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          {post.likes_count}
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          <Reply className="w-4 h-4" />
                          {post.replies_count}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Community Groups</h3>
            <JoinGroupDialog onSuccess={fetchGroups} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">{group.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                    </div>
                    <Badge variant={group.is_member ? "default" : "outline"}>
                      {group.is_member ? "Joined" : "Join"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.member_count} members
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {group.category.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Upcoming Health Events</h3>
            <CreateEventDialog onSuccess={fetchEvents} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold">{event.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    </div>
                    <Badge className={getEventTypeColor(event.event_type)}>
                      {event.event_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      {event.event_time && <span>at {event.event_time}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                    {event.clinic_name && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>By {event.clinic_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm">
                      {event.is_free ? (
                        <Badge variant="outline" className="text-green-600">Free</Badge>
                      ) : (
                        <span className="font-semibold">₹{event.cost}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {event.current_participants}/{event.max_participants} registered
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    onClick={() => joinEvent(event.id)}
                    disabled={event.current_participants >= event.max_participants}
                  >
                    {event.current_participants >= event.max_participants ? 'Full' : 'Register'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Health Challenges Coming Soon!</h3>
              <p className="text-muted-foreground">
                Join community challenges to stay motivated and healthy together.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};