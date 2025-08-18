import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Upload, Play } from 'lucide-react';

interface Student {
  id: string;
  nome: string;
}

interface Exercise {
  nome: string;
  series: number;
  repeticoes: string;
  descanso: string;
  observacoes: string;
  video_demonstracao?: File;
  video_url?: string;
}

export default function CreateTraining() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || '');
  const [trainingData, setTrainingData] = useState({
    nome: '',
    observacoes: ''
  });
  const [exercises, setExercises] = useState<Exercise[]>([
    { nome: '', series: 3, repeticoes: '', descanso: '', observacoes: '' }
  ]);

  useEffect(() => {
    if (profile?.role === 'personal') {
      fetchStudents();
    }
  }, [profile]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, nome')
        .order('nome');
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar alunos",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addExercise = () => {
    setExercises([...exercises, { nome: '', series: 3, repeticoes: '', descanso: '', observacoes: '' }]);
  };

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    setExercises(prev => prev.map((ex, i) => 
      i === index ? { ...ex, [field]: value } : ex
    ));
  };

  const handleVideoSelect = (index: number, file: File) => {
    updateExercise(index, 'video_demonstracao', file);
  };

  const uploadVideo = async (video: File, exerciseId: string): Promise<string> => {
    const fileName = `demonstrations/${exerciseId}_${Date.now()}.${video.name.split('.').pop()}`;
    
    const { data, error } = await supabase.storage
      .from('exercise-videos')
      .upload(fileName, video);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('exercise-videos')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedStudentId) return;

    setLoading(true);
    
    try {
      // Create training
      const { data: training, error: trainingError } = await supabase
        .from('trainings')
        .insert({
          ...trainingData,
          student_id: selectedStudentId
        })
        .select()
        .single();
      
      if (trainingError) throw trainingError;

      // Create exercises
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        
        const { data: createdExercise, error: exerciseError } = await supabase
          .from('exercises')
          .insert({
            training_id: training.id,
            nome: exercise.nome,
            series: exercise.series,
            repeticoes: exercise.repeticoes,
            descanso: exercise.descanso,
            observacoes: exercise.observacoes,
            ordem: i + 1
          })
          .select()
          .single();
        
        if (exerciseError) throw exerciseError;

        // Upload video if provided
        if (exercise.video_demonstracao) {
          const videoUrl = await uploadVideo(exercise.video_demonstracao, createdExercise.id);
          
          const { error: updateError } = await supabase
            .from('exercises')
            .update({ video_demonstracao_url: videoUrl })
            .eq('id', createdExercise.id);
          
          if (updateError) throw updateError;
        }
      }

      toast({
        title: "Treino criado",
        description: "Treino criado com sucesso!"
      });
      
      navigate('/personal/dashboard');
    } catch (error: any) {
      toast({
        title: "Erro ao criar treino",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-card border-b shadow-soft">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/personal/dashboard')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Criar Treino</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Training Info */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Informações do Treino</CardTitle>
              <CardDescription>
                Dados básicos do treino
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="student">Aluno *</Label>
                  <Select 
                    value={selectedStudentId} 
                    onValueChange={setSelectedStudentId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="nome">Nome do Treino *</Label>
                  <Input
                    id="nome"
                    value={trainingData.nome}
                    onChange={(e) => setTrainingData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Treino A - Membros Superiores"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={trainingData.observacoes}
                  onChange={(e) => setTrainingData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações gerais sobre o treino..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Exercises */}
          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Exercícios</CardTitle>
                <CardDescription>
                  Configure os exercícios do treino
                </CardDescription>
              </div>
              <Button type="button" onClick={addExercise} variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exercício
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {exercises.map((exercise, index) => (
                <Card key={index} className="p-4 border-2 border-dashed border-border">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Exercício {index + 1}</h4>
                    {exercises.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeExercise(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="md:col-span-2 lg:col-span-2">
                      <Label>Nome do Exercício *</Label>
                      <Input
                        value={exercise.nome}
                        onChange={(e) => updateExercise(index, 'nome', e.target.value)}
                        placeholder="Ex: Supino Reto"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Séries *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={exercise.series}
                        onChange={(e) => updateExercise(index, 'series', parseInt(e.target.value))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Repetições *</Label>
                      <Input
                        value={exercise.repeticoes}
                        onChange={(e) => updateExercise(index, 'repeticoes', e.target.value)}
                        placeholder="Ex: 8-12"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Descanso</Label>
                      <Input
                        value={exercise.descanso}
                        onChange={(e) => updateExercise(index, 'descanso', e.target.value)}
                        placeholder="Ex: 60-90s"
                      />
                    </div>
                    
                    <div>
                      <Label>Vídeo de Demonstração</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => e.target.files?.[0] && handleVideoSelect(index, e.target.files[0])}
                          className="hidden"
                          id={`video-${index}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`video-${index}`)?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {exercise.video_demonstracao ? 'Trocar Vídeo' : 'Adicionar Vídeo'}
                        </Button>
                        {exercise.video_demonstracao && (
                          <span className="text-sm text-muted-foreground">
                            <Play className="h-4 w-4 inline mr-1" />
                            {exercise.video_demonstracao.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={exercise.observacoes}
                      onChange={(e) => updateExercise(index, 'observacoes', e.target.value)}
                      placeholder="Observações específicas do exercício..."
                      rows={2}
                    />
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/personal/dashboard')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={loading || !selectedStudentId || !trainingData.nome || exercises.some(ex => !ex.nome)}
              className="flex-1"
            >
              {loading ? 'Criando...' : 'Criar Treino'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}