-- Minery Negocios: apply ONLY to the verified Minery project.
-- Private tables and a server-only SECURITY INVOKER RPC. No browser writes.
begin;
create schema if not exists minery_business;
revoke all on schema minery_business from public, anon, authenticated;
grant usage on schema minery_business to service_role;
create table minery_business.shops (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null unique references auth.users(id),
 profile jsonb not null check(jsonb_typeof(profile)='object' and length(profile::text)<=10000), next_sale bigint not null default 1 check(next_sale>0),
 created_at timestamptz not null default now()
);
create table minery_business.members (
 shop_id uuid not null references minery_business.shops(id), user_id uuid not null references auth.users(id),
 role text not null check(role in ('owner','seller','warehouse','viewer')), active boolean not null default true,
 primary key(shop_id,user_id)
);
create index members_user on minery_business.members(user_id,shop_id) where active;
create table minery_business.products (
 id uuid primary key default gen_random_uuid(), shop_id uuid not null references minery_business.shops(id),
 ref text not null check(length(ref) between 1 and 60), name text not null check(length(name) between 1 and 150),
 material text not null check(material in ('Oro','Plata')), law text not null check(length(law) between 1 and 40),
 weight numeric(14,3) not null check(weight>0), qty integer not null check(qty>=0),
 cost numeric(16,2) check(cost>=0), price numeric(16,2) not null check(price>0),
 location text not null default '' check(length(location)<=150), stones text not null default '' check(length(stones)<=500), image text not null default '' check(length(image)<=600000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(shop_id,id)
);
create unique index products_ref on minery_business.products(shop_id,lower(ref));
create table minery_business.sales (
 id uuid primary key default gen_random_uuid(), shop_id uuid not null references minery_business.shops(id),
 number bigint not null, request_key uuid not null, request_body jsonb not null,
 client text not null check(length(client) between 1 and 150), phone text not null default '' check(length(phone)<=30),
 payment text not null check(payment in ('Efectivo','Transferencia','Tarjeta')),
 items jsonb not null check(jsonb_typeof(items)='array'), total numeric(18,2) not null check(total>0),
 store jsonb not null, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 unique(shop_id,number), unique(shop_id,request_key), unique(shop_id,id)
);
create table minery_business.movements (
 id uuid primary key default gen_random_uuid(), shop_id uuid not null references minery_business.shops(id),
 product_id uuid not null, sale_id uuid, line_index integer,
 kind text not null check(kind in ('opening','sale','regularization_in','regularization_out')),
 delta integer not null check(delta<>0), unit_cost numeric(16,2) check(unit_cost>=0),
 provider text, document text, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 foreign key(shop_id,product_id) references minery_business.products(shop_id,id),
 foreign key(shop_id,sale_id) references minery_business.sales(shop_id,id)
);
create index movements_shop on minery_business.movements(shop_id,created_at desc);
create index movements_product on minery_business.movements(shop_id,product_id);
create index sales_shop on minery_business.sales(shop_id,created_at desc);
create table minery_business.commands (
 shop_id uuid not null references minery_business.shops(id), request_key uuid not null,
 action text not null, payload jsonb not null, result jsonb not null, actor uuid not null references auth.users(id),
 created_at timestamptz not null default now(), primary key(shop_id,request_key)
);
alter table minery_business.shops enable row level security;
alter table minery_business.members enable row level security;
alter table minery_business.products enable row level security;
alter table minery_business.sales enable row level security;
alter table minery_business.movements enable row level security;
alter table minery_business.commands enable row level security;
-- No anon/authenticated grants or policies: all operations require verified server auth.
grant select,insert,update on all tables in schema minery_business to service_role;
create function public.minery_business_dispatch(p_actor uuid,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
#variable_conflict use_variable
declare
 shop minery_business.shops; member minery_business.members; product minery_business.products;
 sale minery_business.sales; cmd minery_business.commands; shop_id uuid; key uuid;
 item jsonb; items jsonb:='[]'; line jsonb; updated jsonb; request jsonb; result jsonb;
 amount numeric; quantity integer; unit_price numeric; cost numeric; weight numeric; total numeric:=0;
 product_id uuid; ref text; idx integer; n integer; pending boolean; action_role text;
begin
 if p_actor is null then raise exception 'AUTH_REQUIRED' using errcode='28000'; end if;
 if jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'INVALID_PAYLOAD' using errcode='22023'; end if;
 if p_action='create_shop' then
   if length(btrim(coalesce(p_payload->'profile'->>'name',''))) not between 1 and 150 then raise exception 'SHOP_NAME_REQUIRED' using errcode='22023'; end if;
   insert into minery_business.shops(owner_id,profile) values(p_actor,p_payload->'profile') on conflict(owner_id) do nothing;
   select * into shop from minery_business.shops where owner_id=p_actor;
   insert into minery_business.members(shop_id,user_id,role) values(shop.id,p_actor,'owner') on conflict do nothing;
   return jsonb_build_object('shopId',shop.id);
 end if;
 shop_id:=nullif(p_payload->>'shopId','')::uuid;
 if shop_id is null then select m.shop_id into shop_id from minery_business.members m where m.user_id=p_actor and m.active order by m.shop_id limit 1; end if;
 if shop_id is null and p_action='state' then return jsonb_build_object('onboarding',true); end if;
 select * into member from minery_business.members m where m.shop_id=shop_id and m.user_id=p_actor and m.active;
 if not found then raise exception 'SHOP_FORBIDDEN' using errcode='42501'; end if;
 -- Serialize stock, counters and idempotency for this shop; other shops proceed independently.
 if p_action='state' then
   select * into shop from minery_business.shops s where s.id=shop_id for share;
 else
   select * into shop from minery_business.shops s where s.id=shop_id for update;
 end if;
 if p_action='state' then
   return jsonb_build_object('shopId',shop_id,'role',member.role,'store',shop.profile,
    'products',coalesce((select jsonb_agg(to_jsonb(p)-'shop_id' order by p.created_at) from minery_business.products p where p.shop_id=shop_id),'[]'::jsonb),
    'sales',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'number','MV-'||lpad(s.number::text,6,'0'),'date',s.created_at,'client',s.client,'phone',s.phone,'payment',s.payment,'items',s.items,'store',s.store,'total',s.total) order by s.number) from minery_business.sales s where s.shop_id=shop_id),'[]'::jsonb),
    'movements',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'ref',p.ref,'qty',m.delta,'cost',m.unit_cost,'date',m.created_at,'provider',m.provider,'document',m.document,'operator',m.created_by,'number','MV-'||lpad(s.number::text,6,'0')) order by m.created_at) from minery_business.movements m join minery_business.products p on p.id=m.product_id left join minery_business.sales s on s.id=m.sale_id where m.shop_id=shop_id and m.kind='regularization_in'),'[]'::jsonb));
 end if;
 if p_action not in ('products','sale','resolve','settings') then raise exception 'UNKNOWN_ACTION' using errcode='22023'; end if;
 if member.role='viewer' or (p_action='settings' and member.role<>'owner') or (p_action in ('products','resolve') and member.role not in ('owner','warehouse')) or (p_action='sale' and member.role not in ('owner','seller')) then raise exception 'ROLE_FORBIDDEN' using errcode='42501'; end if;
 key:=(p_payload->>'requestKey')::uuid;
 if key is null then raise exception 'REQUEST_KEY_REQUIRED' using errcode='22023'; end if;
 request:=p_payload-'requestKey';
 select * into cmd from minery_business.commands c where c.shop_id=shop_id and c.request_key=key;
 if found then
   if cmd.action<>p_action or cmd.payload<>request or cmd.actor<>p_actor then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='23505'; end if;
   return cmd.result;
 end if;
 if p_action='settings' then
   if jsonb_typeof(p_payload->'profile') is distinct from 'object' or length(btrim(coalesce(p_payload->'profile'->>'name',''))) not between 1 and 150 then raise exception 'SHOP_NAME_REQUIRED' using errcode='22023'; end if;
   update minery_business.shops s set profile=p_payload->'profile' where s.id=shop_id;
   result:=jsonb_build_object('ok',true);
 elsif p_action='products' then
   if jsonb_typeof(p_payload->'products') is distinct from 'array' or jsonb_array_length(p_payload->'products') not between 1 and 500 then raise exception 'INVALID_PRODUCTS' using errcode='22023'; end if;
   for item in select value from jsonb_array_elements(p_payload->'products') loop
     if item->>'cost' is null then raise exception 'COST_REQUIRED' using errcode='22023'; end if;
     insert into minery_business.products(shop_id,ref,name,material,law,weight,qty,cost,price,location,stones,image)
     values(shop_id,btrim(item->>'ref'),btrim(item->>'name'),item->>'material',item->>'law',(item->>'weight')::numeric,(item->>'qty')::integer,(item->>'cost')::numeric,(item->>'price')::numeric,coalesce(item->>'location',''),coalesce(item->>'stones',''),coalesce(item->>'image','')) returning * into product;
     if product.qty>0 then insert into minery_business.movements(shop_id,product_id,kind,delta,unit_cost,created_by,provider,document) values(shop_id,product.id,'opening',product.qty,product.cost,p_actor,item->>'provider',item->>'document'); end if;
   end loop;
   result:=jsonb_build_object('ok',true);
 elsif p_action='sale' then
   if length(btrim(coalesce(p_payload->>'client',''))) not between 1 and 150 or jsonb_typeof(p_payload->'items') is distinct from 'array' or jsonb_array_length(p_payload->'items') not between 1 and 100 then raise exception 'INVALID_SALE' using errcode='22023'; end if;
   for item in select value from jsonb_array_elements(p_payload->'items') loop
     quantity:=(item->>'qty')::integer; unit_price:=(item->>'price')::numeric;
     if quantity is null or quantity not between 1 and 10000 or unit_price is null or unit_price<=0 or unit_price>10000000000 then raise exception 'INVALID_LINE' using errcode='22023'; end if;
     product_id:=nullif(item->>'productId','')::uuid;
     pending:=false;
     if product_id is not null then
       select * into product from minery_business.products p where p.id=product_id and p.shop_id=shop_id for update;
       if not found then raise exception 'PRODUCT_NOT_FOUND' using errcode='22023'; end if;
       if product.qty<quantity then raise exception 'INSUFFICIENT_STOCK' using errcode='23514'; end if;
       update minery_business.products p set qty=p.qty-quantity,updated_at=now() where p.id=product_id;
     else
       -- A missing product becomes a provisional zero-stock record, owned by this shop.
       pending:=true;
       insert into minery_business.products(shop_id,ref,name,material,law,weight,qty,cost,price,stones,image,location)
       values(shop_id,btrim(item->>'ref'),btrim(item->>'name'),item->>'material',item->>'law',(item->>'weight')::numeric,0,null,unit_price,coalesce(item->>'stones',''),coalesce(item->>'image',''),'Pendiente de ingreso') returning * into product;
       product_id:=product.id;
     end if;
     line:=jsonb_build_object('productId',product_id,'name',product.name,'ref',product.ref,'material',product.material,'law',product.law,'weight',product.weight,'stones',product.stones,'image',product.image,'qty',quantity,'price',round(unit_price,2),'cost',product.cost,'pending',pending);
     items:=items||jsonb_build_array(line);total:=total+quantity*round(unit_price,2);
   end loop;
   insert into minery_business.sales(shop_id,number,request_key,request_body,client,phone,payment,items,total,store,created_by)
    values(shop_id,shop.next_sale,key,request,btrim(p_payload->>'client'),coalesce(p_payload->>'phone',''),p_payload->>'payment',items,total,shop.profile,p_actor) returning * into sale;
   update minery_business.shops s set next_sale=next_sale+1 where s.id=shop_id;
   idx:=0;
   for item in select value from jsonb_array_elements(items) loop
     if not (item->>'pending')::boolean then insert into minery_business.movements(shop_id,product_id,sale_id,line_index,kind,delta,unit_cost,created_by) values(shop_id,(item->>'productId')::uuid,sale.id,idx,'sale',-(item->>'qty')::integer,(item->>'cost')::numeric,p_actor); end if;
     idx:=idx+1;
   end loop;
   result:=jsonb_build_object('saleId',sale.id);
 elsif p_action='resolve' then
   select * into sale from minery_business.sales s where s.shop_id=shop_id and s.id=(p_payload->>'saleId')::uuid for update;
   if not found then raise exception 'SALE_NOT_FOUND' using errcode='22023'; end if;
   idx:=(p_payload->>'index')::integer;
   if idx is null or idx<0 or idx>=jsonb_array_length(sale.items) then raise exception 'LINE_NOT_FOUND' using errcode='22023'; end if;
   item:=sale.items->idx;
   if not (item->>'pending')::boolean then raise exception 'ALREADY_RESOLVED' using errcode='23505'; end if;
   cost:=(p_payload->>'cost')::numeric;
   if cost is null or cost<0 or cost>10000000000 or length(btrim(coalesce(p_payload->>'provider','')))=0 or length(btrim(coalesce(p_payload->>'document','')))=0 then raise exception 'INVALID_ENTRY' using errcode='22023'; end if;
   product_id:=(item->>'productId')::uuid;quantity:=(item->>'qty')::integer;
   update minery_business.products p set cost=round(cost,2),location='Vendido · Regularizado',updated_at=now() where p.id=product_id and p.shop_id=shop_id;
   insert into minery_business.movements(shop_id,product_id,sale_id,line_index,kind,delta,unit_cost,provider,document,created_by)
    values(shop_id,product_id,sale.id,idx,'regularization_in',quantity,cost,p_payload->>'provider',p_payload->>'document',p_actor),
          (shop_id,product_id,sale.id,idx,'regularization_out',-quantity,cost,p_payload->>'provider',p_payload->>'document',p_actor);
   updated:=jsonb_set(sale.items,array[idx::text],item||jsonb_build_object('cost',round(cost,2),'pending',false));
   update minery_business.sales s set items=updated where s.id=sale.id;
   result:=jsonb_build_object('ok',true);
 end if;
 insert into minery_business.commands(shop_id,request_key,action,payload,result,actor) values(shop_id,key,p_action,request,result,p_actor);
 return result;
end $$;
revoke all on function public.minery_business_dispatch(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.minery_business_dispatch(uuid,text,jsonb) to service_role;
commit;
