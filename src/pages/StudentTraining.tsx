import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Dumbbell, 
  Play, 
  Upload,
  Clock,
  RotateCcw,
  CheckCircle,
  Video
} from 'lucide-react';

interface Exercise {
  id: string;
  nome: string;
  series: number;
  repeticoes: string;
  descanso?: string;
  observacoes?: string;
  video_demonstracao_url?: string;
  ordem: number;
  videos: Array<{
    id: string;
    video_url: string;
    data_envio: string;
    observacoes?: string;
  }>;
}

interface Training {
  id: string;
  nome: string;
  observacoes?: string;
  exercises: Exercise[];
}

export default function StudentTraining() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingExerciseId, setUploadingExerciseId] = useState<string | null>(null);
  const [videoFiles, setVideoFiles] = useState<{ [exerciseId: string]: File }>({});
  const [videoObservations, setVideoObservations] = useState<{ [exerciseId: string]: string }>({});

  useEffect(() => {
    if (profile?.role === 'aluno') {
      fetchStudentTraining();
    }
  }, [profile]);

  const fetchStudentTraining = async () => {
    try {
      // Get active training with exercises directly using email join
      const { data, error } = await supabase
        .from('trainings')
        .select(`
          id,
          nome,
          observacoes,
          exercises (
            id,
            nome,
            series,
            repeticoes,
            descanso,
            observacoes,
            video_demonstracao_url,
            ordem,
            videos (
              id,
              video_url,
              data_envio,
              observacoes
            )
          ),
          students!inner (
            id,
            email
          )
        `)
        .eq('students.email', profile?.email)
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No training found
          setTraining(null);
        } else {
          throw error;
        }
      } else {
        // Sort exercises by ordem
        const sortedExercises = data.exercises.sort((a, b) => a.ordem - b.ordem);
        setTraining({ ...data, exercises: sortedExercises });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar treino",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (exerciseId: string, file: File) => {
    setVideoFiles(prev => ({ ...prev, [exerciseId]: file }));
  };

  const uploadVideoExecution = async (exerciseId: string) => {
    if (!videoFiles[exerciseId] || !profile) return;

    setUploadingExerciseId(exerciseId);
    
    try {
      const file = videoFiles[exerciseId];
      const fileName = `executions/${profile.id}/${exerciseId}_${Date.now()}.${file.name.split('.').pop()}`;
      
      // Upload video
      const { data, error: uploadError } = await supabase.storage
        .from('execution-videos')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('execution-videos')
        .getPublicUrl(fileName);
      
      // Save video record
      const { error: videoError } = await supabase
        .from('videos')
        .insert({
          exercise_id: exerciseId,
          aluno_id: profile.id,
          video_url: publicUrl,
          observacoes: videoObservations[exerciseId] || undefined
        });
      
      if (videoError) throw videoError;
      
      toast({
        title: "Vídeo enviado",
        description: "Vídeo de execução enviado com sucesso!"
      });
      
      // Clear form
      setVideoFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[exerciseId];
        return newFiles;
      });
      setVideoObservations(prev => {
        const newObs = { ...prev };
        delete newObs[exerciseId];
        return newObs;
      });
      
      // Refresh training data
      fetchStudentTraining();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar vídeo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingExerciseId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando treino...</p>
        </div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <header className="bg-card border-b shadow-soft">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/student/dashboard')}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Meu Treino</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-medium">
            <CardContent className="py-12 text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Nenhum treino ativo
              </h3>
              <p className="text-muted-foreground">
                Aguarde seu personal trainer criar um treino para você
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-card border-b shadow-soft">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/student/dashboard')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{training.nome}</h1>
              {training.observacoes && (
                <p className="text-muted-foreground mt-1">{training.observacoes}</p>
              )}
            </div>
            <Button 
              onClick={() => navigate(`/student/active-workout?trainingId=${training.id}`)}
              variant="gradient"
              size="lg"
              className="ml-4"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Treino
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {training.exercises.map((exercise, index) => (
            <Card key={exercise.id} className="shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    {exercise.nome}
                  </CardTitle>
                  {exercise.videos.length > 0 && (
                    <Badge variant="default" className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Executado
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Exercise Details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{exercise.series}</div>
                    <div className="text-sm text-muted-foreground">Séries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{exercise.repeticoes}</div>
                    <div className="text-sm text-muted-foreground">Repetições</div>
                  </div>
                  {exercise.descanso && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{exercise.descanso}</div>
                      <div className="text-sm text-muted-foreground">Descanso</div>
                    </div>
                  )}
                </div>

                {exercise.observacoes && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm">
                      <strong>Observações:</strong> {exercise.observacoes}
                    </p>
                  </div>
                )}

                {/* Demonstration Video */}
                {exercise.video_demonstracao_url && (
                  <div>
                    <Label className="flex items-center mb-2">
                      <Play className="h-4 w-4 mr-2" />
                      Vídeo de Demonstração
                    </Label>
                    <video
                      controls
                      className="w-full rounded-lg"
                      src={exercise.video_demonstracao_url}
                    >
                      Seu navegador não suporta vídeo.
                    </video>
                  </div>
                )}

                {/* Previous Executions */}
                {exercise.videos.length > 0 && (
                  <div>
                    <Label className="flex items-center mb-2">
                      <Video className="h-4 w-4 mr-2" />
                      Execuções Enviadas
                    </Label>
                    <div className="space-y-2">
                      {exercise.videos.map((video) => (
                        <div key={video.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Enviado em {formatDate(video.data_envio)}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(video.video_url, '_blank')}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Assistir
                            </Button>
                          </div>
                          {video.observacoes && (
                            <p className="text-sm text-muted-foreground">
                              {video.observacoes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Execution */}
                <div className="border-t pt-4">
                  <Label className="flex items-center mb-2">
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Nova Execução
                  </Label>
                  
                  <div className="space-y-3">
                    <div>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => e.target.files?.[0] && handleVideoSelect(exercise.id, e.target.files[0])}
                        className="hidden"
                        id={`video-${exercise.id}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById(`video-${exercise.id}`)?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {videoFiles[exercise.id] ? 'Trocar Vídeo' : 'Selecionar Vídeo'}
                      </Button>
                      {videoFiles[exercise.id] && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {videoFiles[exercise.id].name}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Textarea
                        placeholder="Observações sobre sua execução (opcional)..."
                        value={videoObservations[exercise.id] || ''}
                        onChange={(e) => setVideoObservations(prev => ({ 
                          ...prev, 
                          [exercise.id]: e.target.value 
                        }))}
                        rows={2}
                      />
                    </div>
                    
                    <Button
                      onClick={() => uploadVideoExecution(exercise.id)}
                      disabled={!videoFiles[exercise.id] || uploadingExerciseId === exercise.id}
                      variant="gradient"
                      className="w-full"
                    >
                      {uploadingExerciseId === exercise.id ? 'Enviando...' : 'Enviar Execução'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}