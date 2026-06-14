-- ZENVORIA production cleanup:
-- odstraneni demo pecovatelek a demo obecnych recenzi, ktere se stale vraceji v /api/bootstrap

begin;

-- nejdriv odstran navazane recenze pro demo pecovatelky
delete from public.zenvoria_reviews
where caregiver_id in (
  select id
  from public.zenvoria_caregivers
  where name in (
    'Martina Svobodová',
    'Lucie Dvořáková',
    'Petra Černá',
    'Hana Veselá',
    'Eva Marková'
  )
);

-- odstran demo pecovatelky
delete from public.zenvoria_caregivers
where name in (
  'Martina Svobodová',
  'Lucie Dvořáková',
  'Petra Černá',
  'Hana Veselá',
  'Eva Marková'
);

-- odstran demo obecne recenze z homepage/search
delete from public.zenvoria_reviews
where caregiver_id is null
  and (
    name in ('Petr M.', 'Jana K.', 'Tomáš S.')
    or text in (
      'Maminka je nadšená. Velmi laskavá a spolehlivá. Doporučuji.',
      'Profesionální přístup a hlavně lidskost. Konečně klid v rodině.',
      'Skvělá komunikace a vždy dochvilná. Tatínek si ji pochvaluje.'
    )
  );

commit;

-- volitelna kontrola po smazani:
-- select id, name from public.zenvoria_caregivers order by id;
-- select id, caregiver_id, name, text from public.zenvoria_reviews order by id;
