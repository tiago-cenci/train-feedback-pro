-- Create custom types
CREATE TYPE public.user_role AS ENUM ('personal', 'aluno');
CREATE TYPE public.correction_type AS ENUM ('texto', 'foto', 'video');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  role user_role NOT NULL DEFAULT 'aluno',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  anamnese TEXT,
  fotos_urls TEXT[], -- Array of photo URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trainings table
CREATE TABLE public.trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  data_inicial DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES public.trainings(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  series INTEGER NOT NULL,
  repeticoes TEXT NOT NULL, -- Can be numbers or ranges like "12-15"
  descanso TEXT, -- Rest time like "60s" or "1-2min"
  observacoes TEXT,
  video_demonstracao_url TEXT,
  ordem INTEGER DEFAULT 1, -- Order in the training
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create videos table (student execution videos)
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  aluno_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  data_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  observacoes TEXT -- Student can add notes
);

-- Create corrections table
CREATE TABLE public.corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  personal_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tipo correction_type NOT NULL,
  conteudo TEXT, -- Text content or description
  arquivo_url TEXT, -- Photo or video URL
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrections ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for students
CREATE POLICY "Personal can view their students" ON public.students
  FOR SELECT USING (personal_id = auth.uid());

CREATE POLICY "Personal can insert students" ON public.students
  FOR INSERT WITH CHECK (personal_id = auth.uid());

CREATE POLICY "Personal can update their students" ON public.students
  FOR UPDATE USING (personal_id = auth.uid());

CREATE POLICY "Personal can delete their students" ON public.students
  FOR DELETE USING (personal_id = auth.uid());

-- RLS Policies for trainings
CREATE POLICY "Personal can manage trainings for their students" ON public.trainings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.students 
      WHERE id = trainings.student_id 
      AND personal_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own trainings" ON public.trainings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE s.id = trainings.student_id 
      AND s.email = p.email
      AND p.role = 'aluno'
    )
  );

-- RLS Policies for exercises
CREATE POLICY "Personal can manage exercises for their students' trainings" ON public.exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.trainings t
      JOIN public.students s ON s.id = t.student_id
      WHERE t.id = exercises.training_id 
      AND s.personal_id = auth.uid()
    )
  );

CREATE POLICY "Students can view exercises from their trainings" ON public.exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trainings t
      JOIN public.students s ON s.id = t.student_id
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE t.id = exercises.training_id 
      AND s.email = p.email
      AND p.role = 'aluno'
    )
  );

-- RLS Policies for videos
CREATE POLICY "Students can manage their own execution videos" ON public.videos
  FOR ALL USING (aluno_id = auth.uid());

CREATE POLICY "Personal can view videos from their students" ON public.videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exercises e
      JOIN public.trainings t ON t.id = e.training_id
      JOIN public.students s ON s.id = t.student_id
      WHERE e.id = videos.exercise_id 
      AND s.personal_id = auth.uid()
    )
  );

-- RLS Policies for corrections
CREATE POLICY "Personal can manage corrections for their students' videos" ON public.corrections
  FOR ALL USING (personal_id = auth.uid());

CREATE POLICY "Students can view corrections on their videos" ON public.corrections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = corrections.video_id 
      AND v.aluno_id = auth.uid()
    )
  );

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('student-photos', 'student-photos', false),
  ('exercise-videos', 'exercise-videos', false),
  ('execution-videos', 'execution-videos', false),
  ('correction-files', 'correction-files', false);

-- Storage policies for student photos
CREATE POLICY "Personal can upload student photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'student-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Personal can view student photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'student-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for exercise demonstration videos
CREATE POLICY "Personal can upload exercise videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exercise-videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view exercise videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'exercise-videos');

-- Storage policies for student execution videos
CREATE POLICY "Students can upload execution videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'execution-videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Personal and students can view execution videos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'execution-videos' AND
    ((storage.foldername(name))[1] = auth.uid()::text OR
     EXISTS (
       SELECT 1 FROM public.profiles 
       WHERE id = auth.uid() AND role = 'personal'
     ))
  );

-- Storage policies for correction files
CREATE POLICY "Personal can upload correction files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'correction-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view correction files" ON storage.objects
  FOR SELECT USING (bucket_id = 'correction-files');

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trainings_updated_at
  BEFORE UPDATE ON public.trainings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'aluno')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();