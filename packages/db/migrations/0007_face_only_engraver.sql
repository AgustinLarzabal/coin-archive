create or replace function enforce_coin_face_engraver_face_only()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from "coin_surface"
    where "coin_surface"."id" = new."coin_face_id"
      and "coin_surface"."kind" in ('obverse', 'reverse')
  ) then
    raise exception 'coin_face_engraver must reference an obverse or reverse coin_surface'
      using errcode = '23514',
        constraint = 'coin_face_engraver_face_only_check';
  end if;

  return new;
end;
$$;
--> statement-breakpoint
create or replace function prevent_coin_surface_non_face_with_engravers()
returns trigger
language plpgsql
as $$
begin
  if new."kind" not in ('obverse', 'reverse')
    and exists (
      select 1
      from "coin_face_engraver"
      where "coin_face_engraver"."coin_face_id" = new."id"
    ) then
    raise exception 'coin_face_engraver must reference an obverse or reverse coin_surface'
      using errcode = '23514',
        constraint = 'coin_face_engraver_face_only_check';
  end if;

  return new;
end;
$$;
--> statement-breakpoint
drop trigger if exists "coin_face_engraver_face_only_check" on "coin_face_engraver";
--> statement-breakpoint
create trigger "coin_face_engraver_face_only_check"
before insert or update on "coin_face_engraver"
for each row
execute function enforce_coin_face_engraver_face_only();
--> statement-breakpoint
drop trigger if exists "coin_surface_face_only_engraver_guard" on "coin_surface";
--> statement-breakpoint
create trigger "coin_surface_face_only_engraver_guard"
before update of "kind" on "coin_surface"
for each row
execute function prevent_coin_surface_non_face_with_engravers();
