create index commands_actor on minery_business.commands(actor);
create index movements_creator on minery_business.movements(created_by);
create index movements_sale on minery_business.movements(shop_id,sale_id);
create index sales_creator on minery_business.sales(created_by);
