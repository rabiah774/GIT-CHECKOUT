-- Insert sample community groups
INSERT INTO public.community_groups (name, description, category, created_by) VALUES
  ('Diabetes Support Group', 'Connect with others managing diabetes and share tips for healthy living', 'condition_support', (SELECT id FROM auth.users LIMIT 1)),
  ('Heart Health Warriors', 'Support group for people with heart conditions and their families', 'condition_support', (SELECT id FROM auth.users LIMIT 1)),
  ('Kolkata Walking Club', 'Daily morning walks in different parks around Kolkata', 'wellness_challenge', (SELECT id FROM auth.users LIMIT 1)),
  ('New Moms Circle', 'Support and advice for new mothers in the community', 'family_circle', (SELECT id FROM auth.users LIMIT 1)),
  ('Mental Health Matters', 'Safe space to discuss mental health and wellness', 'condition_support', (SELECT id FROM auth.users LIMIT 1)),
  ('Fitness After 50', 'Stay active and healthy in your golden years', 'wellness_challenge', (SELECT id FROM auth.users LIMIT 1));

-- Insert sample community posts
DO $$
DECLARE
  user_id UUID;
  group1_id UUID;
  group2_id UUID;
BEGIN
  -- Get a sample user ID
  SELECT id INTO user_id FROM auth.users LIMIT 1;
  
  -- Get group IDs
  SELECT id INTO group1_id FROM public.community_groups WHERE name = 'Diabetes Support Group' LIMIT 1;
  SELECT id INTO group2_id FROM public.community_groups WHERE name = 'Heart Health Warriors' LIMIT 1;
  
  -- Insert sample posts
  INSERT INTO public.community_posts (group_id, author_id, title, content, post_type, is_anonymous) VALUES
    (group1_id, user_id, 'Managing Blood Sugar During Festivals', 'How do you all manage your blood sugar levels during festival season? Looking for practical tips that have worked for you.', 'question', FALSE),
    (group2_id, user_id, 'My Recovery Journey After Heart Surgery', 'Sharing my experience of recovering from bypass surgery. It has been 6 months and I feel stronger than ever. Happy to answer questions.', 'story', FALSE),
    (NULL, user_id, 'Best Time for Morning Walks?', 'What time do you prefer for morning walks? I am trying to build a routine but struggling with timing.', 'question', FALSE),
    (group1_id, user_id, 'Healthy Recipe: Sugar-Free Kheer', 'Found an amazing recipe for sugar-free kheer using dates and almonds. My family loved it! Recipe in comments.', 'discussion', FALSE),
    (NULL, user_id, 'Dealing with Health Anxiety', 'Sometimes I get overwhelmed thinking about my health. How do you cope with health-related anxiety?', 'question', TRUE);
END $$;

-- Insert sample health events
INSERT INTO public.health_events (clinic_id, title, description, event_type, event_date, event_time, location, max_participants, is_free, contact_phone) VALUES
  ((SELECT id FROM public.clinics LIMIT 1), 'Free Diabetes Screening Camp', 'Free blood sugar testing and consultation with diabetologist', 'screening', CURRENT_DATE + INTERVAL '7 days', '09:00', 'Park Street Medical Centre, Kolkata', 100, TRUE, '+91-98300-12345'),
  ((SELECT id FROM public.clinics WHERE clinic_name = 'Salt Lake City Hospital' LIMIT 1), 'Heart Health Workshop', 'Learn about heart-healthy lifestyle and prevention tips', 'workshop', CURRENT_DATE + INTERVAL '10 days', '10:00', 'Salt Lake City Hospital Auditorium', 50, TRUE, '+91-98300-23456'),
  ((SELECT id FROM public.clinics WHERE clinic_name = 'Gariahat Clinic & Diagnostics' LIMIT 1), 'COVID-19 Vaccination Drive', 'Free COVID-19 booster shots for all age groups', 'vaccination', CURRENT_DATE + INTERVAL '5 days', '08:00', 'Gariahat Clinic & Diagnostics', 200, TRUE, '+91-98300-34567'),
  (NULL, 'Women Health Checkup Camp', 'Comprehensive health screening for women including mammography and pap smear', 'health_camp', CURRENT_DATE + INTERVAL '14 days', '09:00', 'Rabindra Sarovar Metro Station, Kolkata', 80, FALSE, '+91-98300-45678');

-- Update the last event with a cost
UPDATE public.health_events 
SET cost = 500.00 
WHERE title = 'Women Health Checkup Camp';

-- Insert some sample group members (auto-join creator to their groups)
INSERT INTO public.group_members (group_id, user_id, role)
SELECT id, created_by, 'admin'
FROM public.community_groups;

-- Insert sample user reputation data
INSERT INTO public.user_reputation (user_id, reputation_points, helpful_answers, posts_created, community_contributions, badges)
SELECT 
  id,
  FLOOR(RANDOM() * 100) + 10,
  FLOOR(RANDOM() * 20),
  FLOOR(RANDOM() * 15) + 1,
  FLOOR(RANDOM() * 25) + 5,
  ARRAY['helpful_member', 'active_poster']
FROM auth.users
LIMIT 5;