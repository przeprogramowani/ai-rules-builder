-- Migration: Add Row Level Security (RLS) to collections table
-- Description: Enables RLS and adds granular policies for collections table access control
-- Author: AI Rules Builder Team
-- Date: 2024-04-02
-- Enable RLS on collections table
alter table public.collections enable row level security;
-- Comment on table to document RLS implementation
comment on table public.collections is 'Collections table with RLS enabled. Access controlled by user_id for authenticated users.';
-- Policy for authenticated users to select their own collections
create policy "Users can view their own collections" on public.collections for
select to authenticated using (auth.uid() = user_id);
-- Policy for authenticated users to insert their own collections
create policy "Users can insert their own collections" on public.collections for
insert to authenticated with check (auth.uid() = user_id);
-- Policy for authenticated users to update their own collections
create policy "Users can update their own collections" on public.collections for
update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Policy for authenticated users to delete their own collections
create policy "Users can delete their own collections" on public.collections for delete to authenticated using (auth.uid() = user_id);
-- Policy for anonymous users to view collections (if needed in the future, currently disabled)
create policy "Anonymous users cannot access collections" on public.collections for all to anon using (false);