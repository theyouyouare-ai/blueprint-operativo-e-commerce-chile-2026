-- Execute in Supabase SQL editor before enabling Mercado Pago.
create table if not exists public.payment_orders (
  id uuid primary key,
  environment text not null check (environment in ('sandbox', 'production')),
  idempotency_key text not null,
  fingerprint text not null,
  capability text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired')),
  order_data jsonb not null,
  checkout_data jsonb not null,
  redirect_url text,
  payment_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (environment, idempotency_key),
  unique (environment, payment_id)
);
alter table public.payment_orders enable row level security;
revoke all on public.payment_orders from anon, authenticated;
grant select, insert, update on public.payment_orders to service_role;

-- Transactional audit: state change and evidence commit together, without customer/card data.
create table if not exists public.payment_audit (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.payment_orders(id),
  payment_id text not null,
  environment text not null,
  previous_status text not null,
  new_status text not null,
  totals jsonb not null,
  occurred_at timestamptz not null default now()
);
alter table public.payment_audit enable row level security;
revoke all on public.payment_audit from anon, authenticated;
revoke insert, update, delete, truncate on public.payment_audit from service_role;
grant select on public.payment_audit to service_role;
create or replace function public.audit_payment_transition() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.status <> new.status then
    if old.status <> 'pending' then
      raise exception 'Payment order already closed';
    end if;
    insert into public.payment_audit(order_id, payment_id, environment, previous_status, new_status, totals)
    values(new.id, new.payment_id, new.environment, old.status, new.status, new.order_data->'totals');
  end if;
  return new;
end;
$$;
revoke all on function public.audit_payment_transition() from public;
drop trigger if exists payment_transition_audit on public.payment_orders;
create trigger payment_transition_audit after update on public.payment_orders
for each row execute function public.audit_payment_transition();
