create policy "orcamentos: member teams" on public.orcamentos_itens for all
using (
  exists (
    select 1
    from perfis p
    left join equipes_membros em on em.perfil_id = p.id
    where p.id = auth.uid()
      and (
        (p.equipe_id is not null and p.equipe_id = orcamentos_itens.equipe_id)
        or (em.equipe_id is not null and em.equipe_id = orcamentos_itens.equipe_id)
      )
  )
)
with check (
  exists (
    select 1
    from perfis p
    left join equipes_membros em on em.perfil_id = p.id
    where p.id = auth.uid()
      and (
        (p.equipe_id is not null and p.equipe_id = orcamentos_itens.equipe_id)
        or (em.equipe_id is not null and em.equipe_id = orcamentos_itens.equipe_id)
      )
  )
);
