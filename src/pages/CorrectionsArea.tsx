import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Play, 
  MessageSquare, 
  Image, 
  Video,
  Send,
  Eye,
  Calendar
} from 'lucide-react';

interface VideoExecution {
  id: string;
  video_url: string;
  data_envio: string;
  observacoes?: string;
  exercise: {
    id: string;
    nome: string;
    training: {
      nome: string;
      student: {
        nome: string;
        email: string;
      }
    }
  };
  corrections: Array<{
    id: string;
    tipo: string;
    conteudo?: string;
    arquivo_url?: string;
    data_criacao: string;
  }>;
}

export default function CorrectionsArea() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [videos, setVideos] = useState<VideoExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoExecution | null>(null);
  const [correctionText, setCorrectionText] = useState('');
  const [correctionFile, setCorrectionFile] = useState<File | null>(null);
  const [correctionType, setCorrectionType] = useState<'texto' | 'foto' | 'video'>('texto');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.role === 'personal') {
      fetchVideos();
    }
  }, [profile]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          id,
          video_url,
          data_envio,
          observacoes,
          exercise:exercises (
            id,
            nome,
            training:trainings (
              nome,
              student:students (
                nome,
                email
              )
            )
          ),
          corrections (
            id,
            tipo,
            conteudo,
            arquivo_url,
            data_criacao
          )
        `)
        .order('data_envio', { ascending: false });
      
      if (error) throw error;
      setVideos(data as VideoExecution[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar vídeos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadCorrectionFile = async (file: File, videoId: string): Promise<string> => {
    const fileName = `corrections/${videoId}_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabase.storage
      .from('correction-files')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('correction-files')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const submitCorrection = async () => {
    if (!selectedVideo || !profile) return;
    
    setSubmitting(true);
    
    try {
      let arquivo_url: string | undefined;
      
      if (correctionFile) {
        arquivo_url = await uploadCorrectionFile(correctionFile, selectedVideo.id);
      }
      
      const { error } = await supabase
        .from('corrections')
        .insert({
          video_id: selectedVideo.id,
          personal_id: profile.id,
          tipo: correctionType,
          conteudo: correctionText || undefined,
          arquivo_url
        });
      
      if (error) throw error;
      
      toast({
        title: "Correção enviada",
        description: "Correção enviada com sucesso!"
      });
      
      // Reset form
      setCorrectionText('');
      setCorrectionFile(null);
      setCorrectionType('texto');
      setSelectedVideo(null);
      
      // Refresh videos
      fetchVideos();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar correção",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando vídeos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-card border-b shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/personal/dashboard')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Área de Correções</h1>
          <p className="text-muted-foreground">
            Vídeos de execução enviados pelos alunos
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video List */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="h-5 w-5 mr-2" />
                Vídeos para Correção ({videos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              {videos.length === 0 ? (
                <div className="text-center py-8">
                  <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum vídeo para correção
                  </p>
                </div>
              ) : (
                videos.map((video) => (
                  <Card
                    key={video.id}
                    className={`cursor-pointer transition-all ${
                      selectedVideo?.id === video.id ? 'ring-2 ring-primary' : 'hover:shadow-medium'
                    }`}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(video.exercise.training.student.nome)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">
                            {video.exercise.training.student.nome}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {video.exercise.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {video.exercise.training.nome}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={video.corrections.length > 0 ? "default" : "secondary"}>
                              {video.corrections.length > 0 ? 'Corrigido' : 'Pendente'}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(video.data_envio)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Video Player and Correction Form */}
          <div className="space-y-6">
            {selectedVideo ? (
              <>
                {/* Video Player */}
                <Card className="shadow-medium">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="h-5 w-5 mr-2" />
                      Vídeo de Execução
                    </CardTitle>
                    <CardDescription>
                      {selectedVideo.exercise.training.student.nome} - {selectedVideo.exercise.nome}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <video
                      controls
                      className="w-full rounded-lg"
                      src={selectedVideo.video_url}
                    >
                      Seu navegador não suporta vídeo.
                    </video>
                    
                    {selectedVideo.observacoes && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Observações do aluno:</strong> {selectedVideo.observacoes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Previous Corrections */}
                {selectedVideo.corrections.length > 0 && (
                  <Card className="shadow-medium">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Correções Anteriores
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedVideo.corrections.map((correction) => (
                        <div key={correction.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              {correction.tipo === 'texto' && <MessageSquare className="h-3 w-3 mr-1" />}
                              {correction.tipo === 'foto' && <Image className="h-3 w-3 mr-1" />}
                              {correction.tipo === 'video' && <Video className="h-3 w-3 mr-1" />}
                              {correction.tipo.charAt(0).toUpperCase() + correction.tipo.slice(1)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(correction.data_criacao)}
                            </span>
                          </div>
                          
                          {correction.conteudo && (
                            <p className="text-sm mb-2">{correction.conteudo}</p>
                          )}
                          
                          {correction.arquivo_url && (
                            <div className="mt-2">
                              {correction.tipo === 'foto' && (
                                <img
                                  src={correction.arquivo_url}
                                  alt="Correção"
                                  className="max-w-full h-auto rounded"
                                />
                              )}
                              {correction.tipo === 'video' && (
                                <video
                                  controls
                                  className="max-w-full rounded"
                                  src={correction.arquivo_url}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Correction Form */}
                <Card className="shadow-medium">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Send className="h-5 w-5 mr-2" />
                      Nova Correção
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={correctionType === 'texto' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCorrectionType('texto')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Texto
                      </Button>
                      <Button
                        type="button"
                        variant={correctionType === 'foto' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCorrectionType('foto')}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Foto
                      </Button>
                      <Button
                        type="button"
                        variant={correctionType === 'video' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCorrectionType('video')}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Vídeo
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor="correction-text">Texto da Correção</Label>
                      <Textarea
                        id="correction-text"
                        value={correctionText}
                        onChange={(e) => setCorrectionText(e.target.value)}
                        placeholder="Digite sua correção..."
                        rows={4}
                      />
                    </div>

                    {(correctionType === 'foto' || correctionType === 'video') && (
                      <div>
                        <Label>
                          {correctionType === 'foto' ? 'Foto de Correção' : 'Vídeo de Correção'}
                        </Label>
                        <input
                          type="file"
                          accept={correctionType === 'foto' ? 'image/*' : 'video/*'}
                          onChange={(e) => setCorrectionFile(e.target.files?.[0] || null)}
                          className="mt-2 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                      </div>
                    )}

                    <Button
                      onClick={submitCorrection}
                      disabled={submitting || (!correctionText && !correctionFile)}
                      className="w-full"
                      variant="gradient"
                    >
                      {submitting ? 'Enviando...' : 'Enviar Correção'}
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="shadow-medium">
                <CardContent className="py-12 text-center">
                  <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Selecione um vídeo para correção
                  </h3>
                  <p className="text-muted-foreground">
                    Clique em um vídeo da lista para visualizar e enviar correções
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}