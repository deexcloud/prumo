-- Prumo: schema inicial para Supabase.
-- Execute este arquivo uma vez no SQL Editor do projeto Supabase.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  logo_url text,
  brand_color text not null default '#e8e9a8' check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  plan_code text,
  billing_status text not null default 'beta',
  plan_interval text,
  plan_price_cents integer,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  checkout_requested_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.organizations add column if not exists plan_code text;
alter table public.organizations add column if not exists billing_status text not null default 'beta';
alter table public.organizations add column if not exists plan_interval text;
alter table public.organizations add column if not exists plan_price_cents integer;
alter table public.organizations add column if not exists trial_started_at timestamptz;
alter table public.organizations add column if not exists trial_ends_at timestamptz;
alter table public.organizations add column if not exists checkout_requested_at timestamptz;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'technician' check (role in ('owner', 'manager', 'technician')),
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  code text not null,
  title text not null,
  description text,
  status text not null default 'scheduled' check (status in ('open', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.service_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  evidence_type text not null check (evidence_type in ('photo', 'signature', 'note', 'location', 'checklist')),
  storage_path text,
  content text,
  latitude double precision,
  longitude double precision,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((latitude is null and longitude is null) or (latitude between -90 and 90 and longitude between -180 and 180))
);

create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (email = lower(email) and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  role text not null check (role in ('manager', 'technician')),
  token_hash text not null unique,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz
);

create index if not exists profiles_organization_id_idx on public.profiles (organization_id);
create index if not exists clients_organization_id_idx on public.clients (organization_id);
create index if not exists service_orders_organization_status_idx on public.service_orders (organization_id, status);
create index if not exists service_orders_assigned_to_idx on public.service_orders (assigned_to);
create index if not exists service_evidence_order_created_idx on public.service_evidence (service_order_id, created_at desc);
create index if not exists team_invitations_organization_created_idx on public.team_invitations (organization_id, created_at desc);

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = (select auth.uid()) limit 1;
$$;

revoke all on function public.current_organization_id() from public;
grant execute on function public.current_organization_id() to authenticated;

-- Criação inicial de empresa + perfil sem abrir INSERT direto nas tabelas.
create or replace function public.create_organization(org_name text, member_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if exists (select 1 from public.profiles where id = current_user_id) then
    raise exception 'User already belongs to an organization';
  end if;

  insert into public.organizations (name) values (trim(org_name)) returning id into new_organization_id;
  insert into public.profiles (id, organization_id, full_name, role)
    values (current_user_id, new_organization_id, trim(member_name), 'owner');
  return new_organization_id;
end;
$$;

revoke all on function public.create_organization(text, text) from public;
grant execute on function public.create_organization(text, text) to authenticated;

drop function if exists public.select_organization_plan(text);

create or replace function public.select_organization_plan(requested_plan text, requested_interval text, start_trial boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_org public.organizations%rowtype;
  selected_price integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if requested_plan is null or requested_plan not in ('essencial', 'equipe', 'operacao') then
    raise exception 'Invalid plan';
  end if;
  if requested_interval is null or requested_interval not in ('monthly', 'yearly') then
    raise exception 'Invalid billing interval';
  end if;
  selected_price := case requested_plan
    when 'essencial' then case requested_interval when 'monthly' then 4900 else 49000 end
    when 'equipe' then case requested_interval when 'monthly' then 11900 else 119000 end
    when 'operacao' then case requested_interval when 'monthly' then 24900 else 249000 end
  end;

  select o.* into current_org
  from public.organizations o
  join public.profiles p on p.organization_id = o.id
  where p.id = current_user_id and p.role = 'owner'
  for update of o;

  if current_org.id is null then
    raise exception 'Only the organization owner can select a plan';
  end if;
  if start_trial and current_org.trial_started_at is not null then
    raise exception 'The free trial has already been used';
  end if;

  update public.organizations
  set plan_code = requested_plan,
      plan_interval = requested_interval,
      plan_price_cents = selected_price,
      billing_status = case when coalesce(start_trial, false) then 'trialing' else 'checkout_pending' end,
      trial_started_at = case when coalesce(start_trial, false) then now() else trial_started_at end,
      trial_ends_at = case when coalesce(start_trial, false) then now() + interval '14 days' else trial_ends_at end,
      checkout_requested_at = case when coalesce(start_trial, false) then null else now() end
  where id = current_org.id;
end;
$$;

revoke all on function public.select_organization_plan(text, text, boolean) from public;
grant execute on function public.select_organization_plan(text, text, boolean) to authenticated;

create or replace function public.create_team_invite(invitee_email text, invitee_role text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  current_user_id uuid := auth.uid();
  current_org_id uuid;
  normalized_email text := lower(trim(invitee_email));
  invite_token text;
  invite_id uuid;
  invite_expiry timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if invitee_role is null or invitee_role not in ('manager', 'technician') then
    raise exception 'Invalid team role';
  end if;

  select organization_id into current_org_id
  from public.profiles
  where id = current_user_id and role in ('owner', 'manager');

  if current_org_id is null then
    raise exception 'Only owners and managers can invite team members';
  end if;
  if normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Enter a valid email address';
  end if;
  if exists (
    select 1 from public.profiles p
    join auth.users u on u.id = p.id
    where p.organization_id = current_org_id and lower(u.email) = normalized_email
  ) then
    raise exception 'This person is already a member of the company';
  end if;
  if exists (
    select 1 from public.team_invitations i
    where i.organization_id = current_org_id and i.email = normalized_email
      and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
  ) then
    raise exception 'There is already a pending invitation for this email';
  end if;

  invite_token := encode(gen_random_bytes(32), 'hex');
  invite_expiry := now() + interval '7 days';
  insert into public.team_invitations (organization_id, email, role, token_hash, invited_by, expires_at)
  values (current_org_id, normalized_email, invitee_role, encode(digest(invite_token, 'sha256'), 'hex'), current_user_id, invite_expiry)
  returning id into invite_id;

  return jsonb_build_object(
    'id', invite_id,
    'email', normalized_email,
    'role', invitee_role,
    'token', invite_token,
    'expires_at', invite_expiry
  );
end;
$$;

revoke all on function public.create_team_invite(text, text) from public;
grant execute on function public.create_team_invite(text, text) to authenticated;

create or replace function public.get_team_invite_details(invite_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  details jsonb;
begin
  if invite_token is null or length(trim(invite_token)) < 32 then
    raise exception 'Invitation link is invalid or expired';
  end if;

  select jsonb_build_object(
    'email', i.email,
    'role', i.role,
    'organization_name', o.name,
    'expires_at', i.expires_at
  ) into details
  from public.team_invitations i
  join public.organizations o on o.id = i.organization_id
  where i.token_hash = encode(digest(trim(invite_token), 'sha256'), 'hex')
    and i.accepted_at is null and i.revoked_at is null and i.expires_at > now();

  if details is null then
    raise exception 'Invitation link is invalid or expired';
  end if;
  return details;
end;
$$;

revoke all on function public.get_team_invite_details(text) from public;
grant execute on function public.get_team_invite_details(text) to anon, authenticated;

create or replace function public.list_team_invitations()
returns table(id uuid, email text, role text, created_at timestamptz, expires_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select i.id, i.email, i.role, i.created_at, i.expires_at
  from public.team_invitations i
  where i.organization_id = (select public.current_organization_id())
    and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner', 'manager'))
  order by i.created_at desc;
$$;

revoke all on function public.list_team_invitations() from public;
grant execute on function public.list_team_invitations() to authenticated;

create or replace function public.revoke_team_invitation(invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_org_id uuid;
begin
  select organization_id into current_org_id from public.profiles
  where id = current_user_id and role in ('owner', 'manager');
  if current_org_id is null then
    raise exception 'Only owners and managers can revoke invitations';
  end if;
  update public.team_invitations
  set revoked_at = now()
  where id = invitation_id and organization_id = current_org_id
    and accepted_at is null and revoked_at is null;
  if not found then
    raise exception 'Invitation was not found or is no longer pending';
  end if;
end;
$$;

revoke all on function public.revoke_team_invitation(uuid) from public;
grant execute on function public.revoke_team_invitation(uuid) to authenticated;

create or replace function public.accept_team_invite(invite_token text, member_name text default '')
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  invitation public.team_invitations%rowtype;
  invite_hash text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  select lower(email) into current_email from auth.users where id = current_user_id;
  invite_hash := encode(digest(trim(coalesce(invite_token, '')), 'sha256'), 'hex');

  select * into invitation from public.team_invitations
  where token_hash = invite_hash for update;
  if not found then
    raise exception 'Invitation link is invalid or expired';
  end if;
  if invitation.accepted_at is not null then
    if invitation.accepted_by = current_user_id then
      return invitation.organization_id;
    end if;
    raise exception 'Invitation has already been used';
  end if;
  if invitation.revoked_at is not null or invitation.expires_at <= now() then
    raise exception 'Invitation link is invalid or expired';
  end if;
  if current_email is null or current_email <> invitation.email then
    raise exception 'Sign in or create an account using the invited email address';
  end if;
  if exists (select 1 from public.profiles where id = current_user_id) then
    raise exception 'This account already belongs to a company';
  end if;

  insert into public.profiles (id, organization_id, full_name, role)
  values (
    current_user_id,
    invitation.organization_id,
    coalesce(nullif(trim(member_name), ''), split_part(current_email, '@', 1)),
    invitation.role
  );
  update public.team_invitations
  set accepted_by = current_user_id, accepted_at = now()
  where id = invitation.id;
  return invitation.organization_id;
end;
$$;

revoke all on function public.accept_team_invite(text, text) from public;
grant execute on function public.accept_team_invite(text, text) to authenticated;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.service_orders enable row level security;
alter table public.service_evidence enable row level security;
alter table public.demo_requests enable row level security;
alter table public.team_invitations enable row level security;

grant select on public.organizations, public.profiles, public.clients, public.service_orders, public.service_evidence to authenticated;
revoke update on public.organizations from authenticated;
grant update (name, logo_url, brand_color) on public.organizations to authenticated;
-- Evita que um membro altere o próprio papel e se promova a administrador.
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
revoke all on public.team_invitations from anon, authenticated;
grant insert, update, delete on public.clients, public.service_orders, public.service_evidence to authenticated;
grant insert on public.demo_requests to anon, authenticated;

drop policy if exists "Members can view their organization" on public.organizations;
create policy "Members can view their organization" on public.organizations
  for select to authenticated
  using (id = (select public.current_organization_id()));

drop policy if exists "Owners and managers can update their organization" on public.organizations;
create policy "Owners and managers can update their organization" on public.organizations
  for update to authenticated
  using (id = (select public.current_organization_id()) and exists (
    select 1 from public.profiles where id = auth.uid() and role in ('owner', 'manager')
  ))
  with check (id = (select public.current_organization_id()));

drop policy if exists "Members can view profiles in their organization" on public.profiles;
create policy "Members can view profiles in their organization" on public.profiles
  for select to authenticated
  using (organization_id = (select public.current_organization_id()));

drop policy if exists "Members can update their own profile" on public.profiles;
create policy "Members can update their own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid() and organization_id = (select public.current_organization_id()))
  with check (id = auth.uid() and organization_id = (select public.current_organization_id()));

drop policy if exists "Members can manage their clients" on public.clients;
create policy "Members can manage their clients" on public.clients
  for all to authenticated
  using (organization_id = (select public.current_organization_id()))
  with check (organization_id = (select public.current_organization_id()));

drop policy if exists "Members can manage their service orders" on public.service_orders;
create policy "Members can manage their service orders" on public.service_orders
  for all to authenticated
  using (organization_id = (select public.current_organization_id()))
  with check (organization_id = (select public.current_organization_id()));

drop policy if exists "Members can manage their service evidence" on public.service_evidence;
create policy "Members can manage their service evidence" on public.service_evidence
  for all to authenticated
  using (organization_id = (select public.current_organization_id()))
  with check (organization_id = (select public.current_organization_id()));

drop policy if exists "Anyone can request a product demo" on public.demo_requests;
create policy "Anyone can request a product demo" on public.demo_requests
  for insert to anon, authenticated
  with check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$');

-- Arquivos de prova ficam privados. Use o ID da empresa como primeira pasta:
-- <organization_id>/<service_order_id>/<arquivo>.
insert into storage.buckets (id, name, public)
values ('service-evidence', 'service-evidence', false)
on conflict (id) do nothing;

drop policy if exists "Members can view evidence files in their organization" on storage.objects;
create policy "Members can view evidence files in their organization" on storage.objects
  for select to authenticated
  using (bucket_id = 'service-evidence' and (storage.foldername(name))[1] = (select public.current_organization_id())::text);

drop policy if exists "Members can upload evidence files to their organization" on storage.objects;
create policy "Members can upload evidence files to their organization" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'service-evidence' and (storage.foldername(name))[1] = (select public.current_organization_id())::text);

drop policy if exists "Members can update evidence files in their organization" on storage.objects;
create policy "Members can update evidence files in their organization" on storage.objects
  for update to authenticated
  using (bucket_id = 'service-evidence' and (storage.foldername(name))[1] = (select public.current_organization_id())::text)
  with check (bucket_id = 'service-evidence' and (storage.foldername(name))[1] = (select public.current_organization_id())::text);

drop policy if exists "Members can delete evidence files in their organization" on storage.objects;
create policy "Members can delete evidence files in their organization" on storage.objects
  for delete to authenticated
  using (bucket_id = 'service-evidence' and (storage.foldername(name))[1] = (select public.current_organization_id())::text);
