ALTER TABLE public.acoes_educativas DROP CONSTRAINT acoes_educativas_status_check;
ALTER TABLE public.acoes_educativas ADD CONSTRAINT acoes_educativas_status_check CHECK (status IN ('PLANEJADA', 'AGENDADA', 'EM_ANDAMENTO', 'REALIZADA', 'CANCELADA'));
UPDATE public.acoes_educativas SET status = 'AGENDADA' WHERE status = 'PLANEJADA';
ALTER TABLE public.acoes_educativas ALTER COLUMN status SET DEFAULT 'AGENDADA';