-- Prumo: schema inicial para Supabase.
-- Execute este arquivo uma vez no SQL Editor do projeto Supabase.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  logo_url text,
  brand_color text not null default '#e8e9a8' check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now()
);

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

create index if not exists profiles_organization_id_idx on public.profiles (organization_id);
create index if not exists clients_organization_id_idx on public.clients (organization_id);
create index if not exists service_orders_organization_status_idx on public.service_orders (organization_id, status);
create index if not exists service_orders_assigned_to_idx on public.service_orders (assigned_to);
create index if not exists service_evidence_order_created_idx on public.service_evidence (service_order_id, created_at desc);

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

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.service_orders enable row level security;
alter table public.service_evidence enable row level security;
alter table public.demo_requests enable row level security;

grant select on public.organizations, public.profiles, public.clients, public.service_orders, public.service_evidence to authenticated;
grant update on public.organizations to authenticated;
-- Evita que um membro altere o próprio papel e se promova a administrador.
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
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
