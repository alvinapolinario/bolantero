-- Progressive registration consent (FR-AUTH-04, NFR-PRIV-02). No money-model change.

alter table public.profiles
  add column if not exists privacy_notice_version text,
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists age_confirmed_at timestamptz,
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists phone_verified_at timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    phone,
    display_name,
    role,
    privacy_notice_version,
    privacy_accepted_at,
    terms_accepted_at,
    age_confirmed_at,
    marketing_opt_in,
    phone_verified_at
  )
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data->>'display_name', 'Bolantero User'),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'customer'),
    new.raw_user_meta_data->>'privacy_notice_version',
    case
      when new.raw_user_meta_data->>'privacy_notice_version' is not null then now()
      else null
    end,
    case
      when new.raw_user_meta_data->>'privacy_notice_version' is not null then now()
      else null
    end,
    case
      when new.raw_user_meta_data->>'age_confirmed' = 'true' then now()
      else null
    end,
    coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false),
    case when new.phone is not null then now() else null end
  );
  return new;
end;
$$;
