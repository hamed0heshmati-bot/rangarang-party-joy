
-- 1. App roles
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "users can view own roles" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid());

-- 2. has_role security definer
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

grant execute on function public.has_role(uuid, app_role) to anon, authenticated;

-- 3. Auto-grant admin to the first user that signs up
create or replace function public.handle_first_user_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created_make_admin
  after insert on auth.users
  for each row execute function public.handle_first_user_admin();

-- 4. Products: admins can write
create policy "admins manage products insert" on public.products
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "admins manage products update" on public.products
  for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admins manage products delete" on public.products
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- 5. Discount codes: public can read (to validate codes at checkout). Writes only by admins or via place_order.
grant select on public.discount_codes to anon, authenticated;
alter table public.discount_codes enable row level security;

create policy "anyone reads discount codes" on public.discount_codes
  for select to anon, authenticated using (true);

create policy "admins manage discount codes" on public.discount_codes
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 6. Orders: admins can read. Public inserts removed (handled by place_order).
drop policy if exists orders_public_insert on public.orders;
drop policy if exists order_items_public_insert on public.order_items;

create policy "admins read orders" on public.orders
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "admins read order_items" on public.order_items
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- 7. place_order RPC — runs as definer so it can write while RLS protects direct access.
create or replace function public.place_order(
  p_customer_name text,
  p_phone text,
  p_city text,
  p_address text,
  p_postal_code text,
  p_notes text,
  p_discount_code text,
  p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty int;
  v_subtotal bigint := 0;
  v_discount_amount bigint := 0;
  v_discount_code_used text := null;
  v_total bigint;
  v_order_id uuid;
  v_order_number int;
  v_dc public.discount_codes%rowtype;
begin
  if length(coalesce(p_customer_name,'')) < 2 then raise exception 'invalid_name' using errcode = 'P0001'; end if;
  if p_phone !~ '^09\d{9}$' then raise exception 'invalid_phone' using errcode = 'P0001'; end if;
  if length(coalesce(p_city,'')) < 2 then raise exception 'invalid_city' using errcode = 'P0001'; end if;
  if length(coalesce(p_address,'')) < 5 then raise exception 'invalid_address' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'empty_cart' using errcode = 'P0001'; end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'too_many_items' using errcode = 'P0001'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty < 1 or v_qty > 999 then raise exception 'invalid_qty' using errcode = 'P0001'; end if;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid for update;
    if not found then raise exception 'product_not_found' using errcode = 'P0001'; end if;
    if v_product.quantity < v_qty then raise exception 'insufficient_stock:%', v_product.name using errcode = 'P0001'; end if;
    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  if p_discount_code is not null and length(p_discount_code) > 0 then
    select * into v_dc from public.discount_codes where code = upper(p_discount_code) and is_active = true;
    if found and (v_dc.usage_limit is null or v_dc.used_count < v_dc.usage_limit) then
      if v_dc.type = 'percent' then
        v_discount_amount := floor((v_subtotal * v_dc.value) / 100);
      else
        v_discount_amount := least(v_dc.value, v_subtotal);
      end if;
      v_discount_code_used := v_dc.code;
      update public.discount_codes set used_count = used_count + 1 where id = v_dc.id;
    end if;
  end if;

  v_total := greatest(0, v_subtotal - v_discount_amount);

  insert into public.orders (customer_name, phone, city, address, postal_code, notes, total_price, discount_code, discount_amount, status)
  values (p_customer_name, p_phone, p_city, p_address, nullif(p_postal_code,''), nullif(p_notes,''), v_total, v_discount_code_used, v_discount_amount, 'pending')
  returning id, order_number into v_order_id, v_order_number;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid;
    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price)
    values (v_order_id, v_product.id, v_product.name, v_qty, v_product.price);
    update public.products set quantity = quantity - v_qty where id = v_product.id;
  end loop;

  return jsonb_build_object('order_number', v_order_number, 'total', v_total);
end;
$$;

grant execute on function public.place_order(text,text,text,text,text,text,text,jsonb) to anon, authenticated;
