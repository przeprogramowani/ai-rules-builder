-- This file is executed after all migrations are applied.
-- It's the best place for development-specific seed data.

-- Note: This seeding logic depends on users with specific emails already existing in the auth.users table.
-- After a 'supabase db reset', you should start your application, create these users through your app's signup process,
-- and then you can manually run the contents of this file in the Supabase Studio SQL Editor to create the memberships.

-- Placeholder membership seed leveraging known launch member emails. Update the array before rollout.
WITH launch_members(email, role) AS (
  VALUES
    ('kontakt@marcinczarkowski.pl', 'member'),
    ('marcin@przeprogramowani.pl', 'admin')
), matched_users AS (
  SELECT users.id, launch_members.role
  FROM auth.users AS users
  JOIN launch_members ON users.email = launch_members.email
), target_org AS (
  SELECT id
  FROM organizations
  WHERE slug = '10xdevs'
)
INSERT INTO organization_members (organization_id, user_id, role)
SELECT target_org.id, matched_users.id, matched_users.role
FROM target_org
JOIN matched_users ON TRUE
ON CONFLICT DO NOTHING;
