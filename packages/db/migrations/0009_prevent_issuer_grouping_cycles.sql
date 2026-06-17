create or replace function prevent_issuer_grouping_cycle()
returns trigger
language plpgsql
as $$
begin
  if new."parent_issuer_id" is null then
    return new;
  end if;

  if exists (
    with recursive issuer_ancestors(id, parent_issuer_id) as (
      select "issuer"."id", "issuer"."parent_issuer_id"
      from "issuer"
      where "issuer"."id" = new."parent_issuer_id"
      union
      select "parent_issuer"."id", "parent_issuer"."parent_issuer_id"
      from "issuer" as "parent_issuer"
      inner join issuer_ancestors
        on "parent_issuer"."id" = issuer_ancestors.parent_issuer_id
    )
    select 1
    from issuer_ancestors
    where issuer_ancestors.id = new."id"
  ) then
    raise exception 'issuer grouping must not contain cycles'
      using errcode = '23514',
        constraint = 'issuer_parent_issuer_id_cycle_check';
  end if;

  return new;
end;
$$;
--> statement-breakpoint
drop trigger if exists "issuer_parent_issuer_id_cycle_check" on "issuer";
--> statement-breakpoint
create trigger "issuer_parent_issuer_id_cycle_check"
before insert or update of "parent_issuer_id" on "issuer"
for each row
execute function prevent_issuer_grouping_cycle();
