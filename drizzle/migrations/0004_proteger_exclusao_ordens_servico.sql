GRANT DELETE ON public.ordens_servico TO authenticated;

DROP POLICY IF EXISTS os_delete ON public.ordens_servico;
CREATE POLICY os_delete
ON public.ordens_servico
FOR DELETE
TO authenticated
USING (public.is_gestor(auth.uid()));