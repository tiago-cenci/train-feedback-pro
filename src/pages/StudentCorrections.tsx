import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  MessageSquare, 
  Image, 
  Video,
  Calendar,
  Play,
  Eye
} from 'lucide-react';

interface Correction {
  id: string;
  tipo: string;
  conteudo?: string;
  arquivo_url?: string;
  data_criacao: string;
  video: {
    id: string;
    video_url: string;
    data_envio: string;
    observacoes?: string;
    exercise: {
      nome: string;
      training: {
        nome: string;
      }
    }
  };
}

export default function StudentCorrections() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCorrection, setSelectedCorrection] = useState<Correction | null>(null);

  useEffect(() => {
    if (profile?.role === 'aluno') {
      fetchCorrections();
    }
  }, [profile]);

  const fetchCorrections = async () => {
    try {
      const { data, error } = await supabase
        .from('corrections')
        .select(`
          id,
          tipo,
          conteudo,
          arquivo_url,
          data_criacao,
          video:videos (
            id,
            video_url,
            data_envio,
            observacoes,
            exercise:exercises (
              nome,
              training:trainings (
                nome
              )
            )
          )
        `)
        .order('data_criacao', { ascending: false });
      
      if (error) throw error;
      setCorrections(data as Correction[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar correções",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'texto':
        return <MessageSquare className="h-4 w-4" />;
      case 'foto':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'texto':
        return 'Texto';
      case 'foto':
        return 'Foto';
      case 'video':
        return 'Vídeo';
      default:
        return 'Correção';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando correções...</p>
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
            onClick={() => navigate('/student/dashboard')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Minhas Correções</h1>
          <p className="text-muted-foreground">
            Feedback do seu personal trainer
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Corrections List */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Histórico de Correções ({corrections.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              {corrections.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma correção recebida ainda
                  </p>
                </div>
              ) : (
                corrections.map((correction) => (
                  <Card
                    key={correction.id}
                    className={`cursor-pointer transition-all ${
                      selectedCorrection?.id === correction.id ? 'ring-2 ring-primary' : 'hover:shadow-medium'
                    }`}
                    onClick={() => setSelectedCorrection(correction)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            {correction.video.exercise.nome}
                          </h4>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getTypeIcon(correction.tipo)}
                            {getTypeLabel(correction.tipo)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {correction.video.exercise.training.nome}
                        </p>
                        
                        {correction.conteudo && (
                          <p className="text-sm line-clamp-2">
                            {correction.conteudo}
                          </p>
                        )}
                        
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(correction.data_criacao)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Correction Details */}
          <div className="space-y-6">
            {selectedCorrection ? (
              <>
                {/* Original Video */}
                <Card className="shadow-medium">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Play className="h-5 w-5 mr-2" />
                      Vídeo Original
                    </CardTitle>
                    <CardDescription>
                      {selectedCorrection.video.exercise.nome} - {selectedCorrection.video.exercise.training.nome}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <video
                      controls
                      className="w-full rounded-lg mb-4"
                      src={selectedCorrection.video.video_url}
                    >
                      Seu navegador não suporta vídeo.
                    </video>
                    
                    <div className="text-sm text-muted-foreground">
                      Enviado em {formatDate(selectedCorrection.video.data_envio)}
                    </div>
                    
                    {selectedCorrection.video.observacoes && (
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Suas observações:</strong> {selectedCorrection.video.observacoes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Correction Content */}
                <Card className="shadow-medium">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {getTypeIcon(selectedCorrection.tipo)}
                      <span className="ml-2">Correção do Personal</span>
                    </CardTitle>
                    <CardDescription>
                      {formatDate(selectedCorrection.data_criacao)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedCorrection.conteudo && (
                      <div className="mb-4">
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedCorrection.conteudo}
                        </p>
                      </div>
                    )}
                    
                    {selectedCorrection.arquivo_url && (
                      <div className="mt-4">
                        {selectedCorrection.tipo === 'foto' && (
                          <img
                            src={selectedCorrection.arquivo_url}
                            alt="Correção em foto"
                            className="max-w-full h-auto rounded-lg"
                          />
                        )}
                        {selectedCorrection.tipo === 'video' && (
                          <video
                            controls
                            className="max-w-full rounded-lg"
                            src={selectedCorrection.arquivo_url}
                          >
                            Seu navegador não suporta vídeo.
                          </video>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="shadow-medium">
                <CardContent className="py-12 text-center">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Selecione uma correção para visualizar
                  </h3>
                  <p className="text-muted-foreground">
                    Clique em uma correção da lista para ver os detalhes
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