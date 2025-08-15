import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Dumbbell, Users, Zap } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect based on user role
      if (profile.role === 'personal') {
        navigate('/personal');
      } else if (profile.role === 'aluno') {
        navigate('/student');
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-gradient-primary p-4 rounded-full shadow-glow">
            <Dumbbell className="h-12 w-12 text-primary-foreground" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
          FitTrainer Pro
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8">
          Plataforma completa para consultoria online de personal trainers
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-card rounded-lg shadow-soft">
            <Users className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Para Alunos</h3>
            <p className="text-sm text-muted-foreground">
              Acesse seus treinos, envie vídeos e receba correções do seu personal
            </p>
          </div>
          
          <div className="p-6 bg-card rounded-lg shadow-soft">
            <Dumbbell className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Para Personal Trainers</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie alunos, crie treinos e envie correções personalizadas
            </p>
          </div>
        </div>
        
        <Button 
          variant="gradient" 
          size="lg" 
          onClick={() => navigate('/auth')}
          className="text-lg px-8 py-3"
        >
          <Zap className="mr-2 h-5 w-5" />
          Começar Agora
        </Button>
      </div>
    </div>
  );
};

export default Index;
