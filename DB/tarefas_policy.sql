create policy "tarefas: member teams" on public.tarefas for all
using (
  exists (
    select 1
    from perfis p
    left join equipes_membros em on em.perfil_id = p.id
    where p.id = auth.uid()
      and (
        (p.equipe_id is not null and p.equipe_id = tarefas.equipe_id)
        or (em.equipe_id is not null and em.equipe_id = tarefas.equipe_id)
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
        (p.equipe_id is not null and p.equipe_id = tarefas.equipe_id)
        or (em.equipe_id is not null and em.equipe_id = tarefas.equipe_id)
      )
  )
);
