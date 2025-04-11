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
-- Enable RLS
alter table user_consents enable row level security;
-- Create indexes
create index user_consents_user_id_idx on user_consents(user_id);
-- Comments
comment on table user_consents is 'Stores user consent records for privacy policy and other terms';
comment on column user_consents.privacy_policy_version is 'Version or date of the privacy policy that was accepted';
-- RLS Policies for authenticated users
create policy "Users can view their own consents" on user_consents for
select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own consents" on user_consents for
insert to authenticated with check (auth.uid() = user_id);
-- RLS Policies for anonymous users (view only for verification purposes)
create policy "Anonymous users cannot view consents" on user_consents for
select to anon using (false);
create policy "Anonymous users cannot insert consents" on user_consents for
insert to anon with check (false);