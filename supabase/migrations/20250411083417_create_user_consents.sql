-- Migration: Create user consents table
-- Description: Stores user consent records for privacy policy acceptance
-- Tables affected: user_consents
-- Special considerations: Implements RLS for data protection
-- Create user consents table
create table user_consents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  privacy_policy_version text not null,
  consented_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);
-- Create indexes
create index user_consents_user_id_idx on user_consents(user_id);
-- Comments
comment on table user_consents is 'Stores user consent records for privacy policy and other terms';
comment on column user_consents.privacy_policy_version is 'Version or date of the privacy policy that was accepted';