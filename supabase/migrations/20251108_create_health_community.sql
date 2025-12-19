-- Create health community tables

-- Community groups table
CREATE TABLE public.community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('condition_support', 'wellness_challenge', 'local_group', 'family_circle')),
  condition_type TEXT, -- for condition-specific groups
  location TEXT, -- for local groups
  is_private BOOLEAN DEFAULT FALSE,
  max_members INTEGER DEFAULT 100,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members table
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.community_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Community posts table
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.community_groups(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'question', 'story', 'event', 'challenge')),
  is_anonymous BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post replies table
CREATE TABLE public.post_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post likes table
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.post_replies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id),
  UNIQUE(reply_id, user_id),
  CHECK ((post_id IS NOT NULL AND reply_id IS NULL) OR (post_id IS NULL AND reply_id IS NOT NULL))
);

-- Health events table
CREATE TABLE public.health_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('health_camp', 'vaccination', 'workshop', 'screening')),
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT TRUE,
  cost DECIMAL(10, 2),
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event participants table
CREATE TABLE public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.health_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- User reputation table
CREATE TABLE public.user_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  reputation_points INTEGER DEFAULT 0,
  helpful_answers INTEGER DEFAULT 0,
  posts_created INTEGER DEFAULT 0,
  community_contributions INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Community groups - anyone can view public groups
CREATE POLICY "Anyone can view public groups"
  ON public.community_groups FOR SELECT
  TO authenticated
  USING (NOT is_private OR EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = community_groups.id 
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can create groups"
  ON public.community_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Group members
CREATE POLICY "Members can view group membership"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Community posts
CREATE POLICY "Users can view posts in their groups"
  ON public.community_posts FOR SELECT
  TO authenticated
  USING (
    group_id IS NULL OR EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = community_posts.group_id 
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create posts"
  ON public.community_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Post replies
CREATE POLICY "Users can view replies"
  ON public.post_replies FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can create replies"
  ON public.post_replies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Post likes
CREATE POLICY "Users can manage their likes"
  ON public.post_likes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Health events
CREATE POLICY "Anyone can view events"
  ON public.health_events FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Clinics can create events"
  ON public.health_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clinics 
      WHERE clinics.id = health_events.clinic_id 
      AND clinics.user_id = auth.uid()
    )
  );

-- Event participants
CREATE POLICY "Users can manage their event participation"
  ON public.event_participants FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- User reputation
CREATE POLICY "Users can view all reputation"
  ON public.user_reputation FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can update own reputation"
  ON public.user_reputation FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_community_groups_category ON public.community_groups(category);
CREATE INDEX idx_community_posts_group_id ON public.community_posts(group_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_health_events_date ON public.health_events(event_date);
CREATE INDEX idx_health_events_location ON public.health_events(location);

-- Create triggers for updated_at
CREATE TRIGGER update_community_groups_updated_at
  BEFORE UPDATE ON public.community_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update post counts
CREATE OR REPLACE FUNCTION public.update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update replies count
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.community_posts 
      SET replies_count = replies_count + 1 
      WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update replies count
    IF OLD.post_id IS NOT NULL THEN
      UPDATE public.community_posts 
      SET replies_count = replies_count - 1 
      WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for post counts
CREATE TRIGGER update_post_replies_count
  AFTER INSERT OR DELETE ON public.post_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_post_counts();

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.community_posts 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.post_id;
    ELSIF NEW.reply_id IS NOT NULL THEN
      UPDATE public.post_replies 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.reply_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE public.community_posts 
      SET likes_count = likes_count - 1 
      WHERE id = OLD.post_id;
    ELSIF OLD.reply_id IS NOT NULL THEN
      UPDATE public.post_replies 
      SET likes_count = likes_count - 1 
      WHERE id = OLD.reply_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for likes count
CREATE TRIGGER update_likes_count_trigger
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();