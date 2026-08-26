-- Trato Protegido — Week 3 schema + RLS
-- Run once in the Supabase SQL editor.

create extension if not exists pgcrypto;

create type deal_status as enum ('pending', 'buyer_verified', 'funds_held', 'shipped', 'completed');
create type escrow_state as enum ('none', 'held', 'released');

create table deals (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id),
  buyer_id uuid references auth.users(id),
  item_name text not null check (char_length(item_name) between 1 and 100),
  item_price numeric(12, 2) not null check (item_price > 0 and item_price <= 1000000),
  status deal_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table verifications (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  buyer_id_photo_url text,
  buyer_selfie_url text,
  liveness_result text check (liveness_result in ('pass', 'fail')),
  verified_at timestamptz
);

create table escrow_status (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null unique references deals(id) on delete cascade,
  amount numeric(12, 2) not null,
  status escrow_state not null default 'none',
  updated_at timestamptz not null default now()
);

-- RLS restricts rows, but the `authenticated` role still needs the base
-- table privilege to touch these tables at all — grant that explicitly
-- rather than relying on a project's default privilege configuration.
grant usage on schema public to authenticated;
grant select, insert, update on public.deals to authenticated;
grant select, insert on public.verifications to authenticated;
grant select, update on public.escrow_status to authenticated;

-- Auto-create the escrow row (amount = item_price, status 'none') whenever a
-- deal is created, so the app never has to insert it separately.
create function create_escrow_row()
returns trigger as $$
begin
  insert into escrow_status (deal_id, amount) values (new.id, new.item_price);
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_create_escrow
after insert on deals
for each row execute function create_escrow_row();

-- item_name / item_price / seller_id must never change after creation.
create function lock_deal_fields()
returns trigger as $$
begin
  if new.item_name <> old.item_name
    or new.item_price <> old.item_price
    or new.seller_id <> old.seller_id then
    raise exception 'deal core fields are immutable';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_lock_deal_fields
before update on deals
for each row execute function lock_deal_fields();

-- The one privileged operation in the whole schema: a buyer "claiming" a
-- deal via its share link. RLS alone can't allow this (buyer_id is still
-- null, so no policy matches the caller yet) without also letting any
-- authenticated user browse every unclaimed deal. This function performs
-- the single atomic transition and is the only way buyer_id is ever set.
create function claim_deal(p_deal_id uuid)
returns deals as $$
declare
  d deals;
begin
  update deals
    set buyer_id = auth.uid()
    where id = p_deal_id
      and buyer_id is null
      and status = 'pending'
      and seller_id <> auth.uid()
    returning * into d;

  if d.id is null then
    raise exception 'deal not claimable';
  end if;

  return d;
end;
$$ language plpgsql security definer;

grant execute on function claim_deal(uuid) to authenticated;

alter table deals enable row level security;
alter table verifications enable row level security;
alter table escrow_status enable row level security;

create policy deals_select on deals for select
  using (auth.uid() = seller_id or auth.uid() = buyer_id);

create policy deals_insert on deals for insert
  with check (auth.uid() = seller_id and buyer_id is null);

create policy deals_update on deals for update
  using (auth.uid() = seller_id or auth.uid() = buyer_id)
  with check (auth.uid() = seller_id or auth.uid() = buyer_id);

create policy verifications_select on verifications for select
  using (exists (
    select 1 from deals d
    where d.id = deal_id and (d.seller_id = auth.uid() or d.buyer_id = auth.uid())
  ));

create policy verifications_insert on verifications for insert
  with check (exists (
    select 1 from deals d where d.id = deal_id and d.buyer_id = auth.uid()
  ));

create policy escrow_select on escrow_status for select
  using (exists (
    select 1 from deals d
    where d.id = deal_id and (d.seller_id = auth.uid() or d.buyer_id = auth.uid())
  ));

create policy escrow_update on escrow_status for update
  using (exists (
    select 1 from deals d where d.id = deal_id and d.buyer_id = auth.uid()
  ));

-- Private storage bucket for the ID photo + selfie pair, scoped by a
-- `<deal_id>/...` path prefix so storage RLS can key off the owning deal.
insert into storage.buckets (id, name, public)
values ('verifications', 'verifications', false)
on conflict (id) do nothing;

create policy verif_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'verifications'
    and exists (
      select 1 from deals d
      where d.id::text = (storage.foldername(name))[1] and d.buyer_id = auth.uid()
    )
  );

create policy verif_read on storage.objects for select to authenticated
  using (
    bucket_id = 'verifications'
    and exists (
      select 1 from deals d
      where d.id::text = (storage.foldername(name))[1]
        and (d.seller_id = auth.uid() or d.buyer_id = auth.uid())
    )
  );
