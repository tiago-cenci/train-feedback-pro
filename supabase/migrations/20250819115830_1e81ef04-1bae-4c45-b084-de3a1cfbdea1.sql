-- Create table for workout sessions (execuções de treino)
CREATE TABLE public.workout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  training_id UUID NOT NULL,
  aluno_id UUID NOT NULL,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_fim TIMESTAMP WITH TIME ZONE,
  duracao_minutos INTEGER,
  observacoes TEXT,
  finalizado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for workout sets (séries executadas)
CREATE TABLE public.workout_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_session_id UUID NOT NULL,
  exercise_id UUID NOT NULL,
  serie_numero INTEGER NOT NULL,
  repeticoes INTEGER NOT NULL,
  carga DECIMAL(5,2),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_sessions
CREATE POLICY "Students can manage their own workout sessions" 
ON public.workout_sessions 
FOR ALL 
USING (aluno_id = auth.uid());

CREATE POLICY "Personal can view their students' workout sessions" 
ON public.workout_sessions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM trainings t 
  JOIN students s ON s.id = t.student_id 
  WHERE t.id = workout_sessions.training_id 
  AND s.personal_id = auth.uid()
));

-- RLS policies for workout_sets
CREATE POLICY "Students can manage their own workout sets" 
ON public.workout_sets 
FOR ALL 
USING (EXISTS (
  SELECT 1 
  FROM workout_sessions ws 
  WHERE ws.id = workout_sets.workout_session_id 
  AND ws.aluno_id = auth.uid()
));

CREATE POLICY "Personal can view their students' workout sets" 
ON public.workout_sets 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM workout_sessions ws 
  JOIN trainings t ON t.id = ws.training_id 
  JOIN students s ON s.id = t.student_id 
  WHERE ws.id = workout_sets.workout_session_id 
  AND s.personal_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_workout_sessions_updated_at
BEFORE UPDATE ON public.workout_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_sets_updated_at
BEFORE UPDATE ON public.workout_sets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();