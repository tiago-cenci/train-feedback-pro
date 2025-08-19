import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Play, 
  Pause,
  StopCircle,
  Check,
  Timer,
  Eye,
  MessageSquare,
  Dumbbell,
  Plus,
  Minus
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
  corrections: Array<{
    id: string;
    tipo: string;
    conteudo?: string;
    data_criacao: string;
  }>;
}

interface Training {
  id: string;
  nome: string;
  observacoes?: string;
  exercises: Exercise[];
}

interface WorkoutSet {
  serie_numero: number;
  repeticoes: number;
  carga: number;
  observacoes?: string;
}

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const trainingId = searchParams.get('trainingId');
  
  const [training, setTraining] = useState<Training | null>(null);
  const [currentWorkoutSession, setCurrentWorkoutSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseSets, setExerciseSets] = useState<{ [exerciseId: string]: WorkoutSet[] }>({});
  const [currentSet, setCurrentSet] = useState<WorkoutSet>({
    serie_numero: 1,
    repeticoes: 0,
    carga: 0,
    observacoes: ''
  });
  const [workoutTime, setWorkoutTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showCorrections, setShowCorrections] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (trainingId && profile?.role === 'aluno') {
      fetchTraining();
    }
  }, [trainingId, profile]);

  useEffect(() => {
    if (workoutStarted && !isPaused) {
      intervalRef.current = setInterval(() => {
        setWorkoutTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workoutStarted, isPaused]);

  const fetchTraining = async () => {
    try {
      // Get student record first
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', profile?.email)
        .single();
      
      if (studentError) throw studentError;

      // Get training with exercises and corrections
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
              corrections (
                id,
                tipo,
                conteudo,
                data_criacao
              )
            )
          )
        `)
        .eq('id', trainingId)
        .eq('student_id', student.id)
        .eq('ativo', true)
        .single();
      
      if (error) throw error;

      // Transform corrections data
      const transformedExercises = data.exercises.map(exercise => ({
        ...exercise,
        corrections: exercise.videos.flatMap(video => video.corrections || [])
      }));

      const sortedExercises = transformedExercises.sort((a, b) => a.ordem - b.ordem);
      setTraining({ ...data, exercises: sortedExercises });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar treino",
        description: error.message,
        variant: "destructive"
      });
      navigate('/student/training');
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          training_id: trainingId,
          aluno_id: profile?.id,
          finalizado: false
        })
        .select('id')
        .single();

      if (error) throw error;

      setCurrentWorkoutSession(data.id);
      setWorkoutStarted(true);
      setWorkoutTime(0);
      
      toast({
        title: "Treino iniciado",
        description: "Boa sorte no seu treino!"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao iniciar treino",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addSet = async () => {
    if (!currentWorkoutSession || !training) return;

    const exercise = training.exercises[currentExerciseIndex];
    const sets = exerciseSets[exercise.id] || [];

    try {
      const newSet = {
        ...currentSet,
        serie_numero: sets.length + 1
      };

      const { error } = await supabase
        .from('workout_sets')
        .insert({
          workout_session_id: currentWorkoutSession,
          exercise_id: exercise.id,
          serie_numero: newSet.serie_numero,
          repeticoes: newSet.repeticoes,
          carga: newSet.carga,
          observacoes: newSet.observacoes || undefined
        });

      if (error) throw error;

      setExerciseSets(prev => ({
        ...prev,
        [exercise.id]: [...sets, newSet]
      }));

      setCurrentSet({
        serie_numero: sets.length + 2,
        repeticoes: 0,
        carga: newSet.carga, // Keep same weight by default
        observacoes: ''
      });

      toast({
        title: "Série adicionada",
        description: `Série ${newSet.serie_numero} registrada com sucesso`
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar série",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const finishWorkout = async () => {
    if (!currentWorkoutSession) return;

    try {
      const { error } = await supabase
        .from('workout_sessions')
        .update({
          data_fim: new Date().toISOString(),
          duracao_minutos: Math.floor(workoutTime / 60),
          finalizado: true
        })
        .eq('id', currentWorkoutSession);

      if (error) throw error;

      toast({
        title: "Treino finalizado",
        description: `Parabéns! Treino concluído em ${formatTime(workoutTime)}`
      });

      navigate('/student/training');
    } catch (error: any) {
      toast({
        title: "Erro ao finalizar treino",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentExercise = training?.exercises[currentExerciseIndex];
  const currentExerciseSets = currentExercise ? exerciseSets[currentExercise.id] || [] : [];

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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="mx-4 max-w-md w-full">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Treino não encontrado</p>
            <Button onClick={() => navigate('/student/training')}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b shadow-soft sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/student/training')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            {workoutStarted && (
              <div className="flex items-center space-x-2">
                <Timer className="h-4 w-4 text-primary" />
                <span className="font-mono text-lg font-bold">
                  {formatTime(workoutTime)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
          
          <h1 className="text-xl font-bold mt-2">{training.nome}</h1>
        </div>
      </header>

      <main className="px-4 py-4 pb-20">
        {!workoutStarted ? (
          // Pre-workout screen
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Dumbbell className="h-5 w-5 mr-2" />
                Iniciar Treino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {training.observacoes && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm">{training.observacoes}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="font-medium">Exercícios do treino:</h3>
                {training.exercises.map((exercise, index) => (
                  <div key={exercise.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{index + 1}. {exercise.nome}</span>
                    <Badge variant="outline">{exercise.series} séries</Badge>
                  </div>
                ))}
              </div>

              <Button 
                onClick={startWorkout}
                className="w-full"
                size="lg"
                variant="gradient"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Treino
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Active workout screen
          <div className="space-y-4">
            {/* Progress */}
            <Card className="shadow-medium">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Exercício {currentExerciseIndex + 1} de {training.exercises.length}
                  </span>
                  <Badge variant="outline">
                    {currentExerciseSets.length}/{currentExercise?.series} séries
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ 
                      width: `${((currentExerciseIndex + 1) / training.exercises.length) * 100}%` 
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Current Exercise */}
            {currentExercise && (
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{currentExercise.nome}</span>
                    <div className="flex space-x-2">
                      {currentExercise.video_demonstracao_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowVideo(!showVideo)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {currentExercise.corrections.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCorrections(!showCorrections)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Exercise details */}
                  <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">{currentExercise.series}</div>
                      <div className="text-xs text-muted-foreground">Séries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">{currentExercise.repeticoes}</div>
                      <div className="text-xs text-muted-foreground">Repetições</div>
                    </div>
                    {currentExercise.descanso && (
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary">{currentExercise.descanso}</div>
                        <div className="text-xs text-muted-foreground">Descanso</div>
                      </div>
                    )}
                  </div>

                  {currentExercise.observacoes && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm">{currentExercise.observacoes}</p>
                    </div>
                  )}

                  {/* Demonstration video */}
                  {showVideo && currentExercise.video_demonstracao_url && (
                    <div>
                      <Label className="text-sm font-medium">Vídeo de Demonstração</Label>
                      <video
                        controls
                        className="w-full rounded-lg mt-2"
                        src={currentExercise.video_demonstracao_url}
                      >
                        Seu navegador não suporta vídeo.
                      </video>
                    </div>
                  )}

                  {/* Corrections history */}
                  {showCorrections && currentExercise.corrections.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Correções Anteriores</Label>
                      <div className="space-y-2 mt-2">
                        {currentExercise.corrections.slice(0, 3).map((correction) => (
                          <div key={correction.id} className="p-2 bg-muted rounded text-sm">
                            <div className="flex justify-between items-start mb-1">
                              <Badge variant="outline" className="text-xs">
                                {correction.tipo}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(correction.data_criacao).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            {correction.conteudo && (
                              <p className="text-muted-foreground">{correction.conteudo}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed sets */}
                  {currentExerciseSets.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Séries Completadas</Label>
                      <div className="space-y-2 mt-2">
                        {currentExerciseSets.map((set, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded">
                            <span className="text-sm">Série {set.serie_numero}</span>
                            <span className="text-sm">{set.repeticoes} reps × {set.carga}kg</span>
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add new set */}
                  {currentExerciseSets.length < currentExercise.series && (
                    <div className="space-y-3 border-t pt-4">
                      <Label className="text-sm font-medium">
                        Série {currentSet.serie_numero}
                      </Label>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Repetições</Label>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentSet(prev => ({ 
                                ...prev, 
                                repeticoes: Math.max(0, prev.repeticoes - 1) 
                              }))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={currentSet.repeticoes}
                              onChange={(e) => setCurrentSet(prev => ({ 
                                ...prev, 
                                repeticoes: parseInt(e.target.value) || 0 
                              }))}
                              className="text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentSet(prev => ({ 
                                ...prev, 
                                repeticoes: prev.repeticoes + 1 
                              }))}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Carga (kg)</Label>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentSet(prev => ({ 
                                ...prev, 
                                carga: Math.max(0, prev.carga - 2.5) 
                              }))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              step="0.5"
                              value={currentSet.carga}
                              onChange={(e) => setCurrentSet(prev => ({ 
                                ...prev, 
                                carga: parseFloat(e.target.value) || 0 
                              }))}
                              className="text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentSet(prev => ({ 
                                ...prev, 
                                carga: prev.carga + 2.5 
                              }))}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Observações (opcional)</Label>
                        <Textarea
                          placeholder="Como foi a série? Alguma dificuldade?"
                          value={currentSet.observacoes}
                          onChange={(e) => setCurrentSet(prev => ({ 
                            ...prev, 
                            observacoes: e.target.value 
                          }))}
                          rows={2}
                          className="text-sm"
                        />
                      </div>

                      <Button
                        onClick={addSet}
                        disabled={currentSet.repeticoes === 0}
                        className="w-full"
                        variant="gradient"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Concluir Série {currentSet.serie_numero}
                      </Button>
                    </div>
                  )}

                  {/* Exercise navigation */}
                  {currentExerciseSets.length >= currentExercise.series && (
                    <div className="border-t pt-4">
                      {currentExerciseIndex < training.exercises.length - 1 ? (
                        <Button
                          onClick={() => {
                            setCurrentExerciseIndex(prev => prev + 1);
                            setCurrentSet({
                              serie_numero: 1,
                              repeticoes: 0,
                              carga: 0,
                              observacoes: ''
                            });
                          }}
                          className="w-full"
                          variant="gradient"
                        >
                          Próximo Exercício
                        </Button>
                      ) : (
                        <Button
                          onClick={finishWorkout}
                          className="w-full"
                          variant="gradient"
                        >
                          <StopCircle className="h-4 w-4 mr-2" />
                          Finalizar Treino
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Fixed bottom bar for active workout */}
      {workoutStarted && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Exercício {currentExerciseIndex + 1}/{training.exercises.length}
            </div>
            <Button
              onClick={finishWorkout}
              variant="destructive"
              size="sm"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}