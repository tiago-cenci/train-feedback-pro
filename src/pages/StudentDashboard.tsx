import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Dumbbell, 
  Play, 
  Clock,
  Repeat,
  MessageSquare,
  Upload,
  LogOut,
  CheckCircle,
  Timer
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
}

interface Training {
  id: string;
  nome: string;
  data_inicial: string;
  observacoes?: string;
  ativo: boolean;
  exercises: Exercise[];
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  
  const [currentTraining, setCurrentTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'aluno') {
      navigate('/');
      return;
    }
    fetchCurrentTraining();
  }, [profile, navigate]);

  const fetchCurrentTraining = async () => {
    try {
      // Find the student record by email
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', profile?.email)
        .single();

      if (studentError) {
        console.log('Student not found:', studentError);
        setLoading(false);
        return;
      }

      // Get the active training
      const { data: trainingData, error: trainingError } = await supabase
        .from('trainings')
        .select(`
          *,
          exercises (*)
        `)
        .eq('student_id', studentData.id)
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (trainingError) throw trainingError;

      if (trainingData && trainingData.length > 0) {
        const training = trainingData[0];
        // Sort exercises by ordem
        training.exercises = training.exercises.sort((a: Exercise, b: Exercise) => a.ordem - b.ordem);
        setCurrentTraining(training);
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

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando seu treino...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b shadow-soft">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-primary p-2 rounded-full">
                <Dumbbell className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">FitTrainer Pro</h1>
                <p className="text-sm text-muted-foreground">
                  Olá, {profile?.nome}
                </p>
              </div>
            </div>
            
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentTraining ? (
          <Card className="shadow-medium">
            <CardContent className="p-12 text-center">
              <Dumbbell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum treino ativo</h3>
              <p className="text-muted-foreground mb-6">
                Seu personal trainer ainda não criou um treino para você. 
                Entre em contato para solicitar seu programa de exercícios.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate('/student/history')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ver Histórico
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Training Header */}
            <Card className="shadow-medium mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Dumbbell className="h-5 w-5 mr-2" />
                      {currentTraining.nome}
                    </CardTitle>
                    <CardDescription>
                      Treino iniciado em {new Date(currentTraining.data_inicial).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-success text-success-foreground">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
                {currentTraining.observacoes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{currentTraining.observacoes}</p>
                  </div>
                )}
              </CardHeader>
            </Card>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button variant="gradient" onClick={() => navigate('/student/upload-video')}>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Vídeo
              </Button>
              
              <Button variant="outline" onClick={() => navigate('/student/corrections')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Ver Correções
              </Button>
              
              <Button variant="outline" onClick={() => navigate('/student/history')}>
                <Clock className="h-4 w-4 mr-2" />
                Histórico
              </Button>
            </div>

            {/* Exercises List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Exercícios do Treino</h2>
              
              {currentTraining.exercises.map((exercise, index) => (
                <Card key={exercise.id} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-lg">{exercise.nome}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Repeat className="h-3 w-3 mr-1" />
                            <span>{exercise.series} séries</span>
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span>{exercise.repeticoes} reps</span>
                          </div>
                          {exercise.descanso && (
                            <div className="flex items-center">
                              <Timer className="h-3 w-3 mr-1" />
                              <span>{exercise.descanso}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>

                    {exercise.observacoes && (
                      <div className="mb-3 p-2 bg-muted rounded text-sm">
                        <strong>Observações:</strong> {exercise.observacoes}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      {exercise.video_demonstracao_url && (
                        <Button size="sm" variant="outline">
                          <Play className="h-3 w-3 mr-1" />
                          Ver Demonstração
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => navigate(`/student/upload-video?exercise=${exercise.id}`)}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Enviar Execução
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}