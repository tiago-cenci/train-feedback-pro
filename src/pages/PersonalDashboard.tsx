import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  Dumbbell, 
  Play, 
  Calendar,
  Phone,
  Mail,
  LogOut,
  BarChart3
} from 'lucide-react';

interface Student {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  data_inicio: string;
  anamnese?: string;
  fotos_urls?: string[];
}

export default function PersonalDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'personal') {
      navigate('/');
      return;
    }
    fetchStudents();
  }, [profile, navigate]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar alunos",
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-primary p-2 rounded-full">
                <Dumbbell className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">FitTrainer Pro</h1>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo, {profile?.nome}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{students.length}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treinos Ativos</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {/* We'll calculate this later with training data */}
                0
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Correções Pendentes</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {/* We'll calculate this later with video data */}
                0
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button 
            variant="gradient" 
            onClick={() => navigate('/personal/add-student')}
            className="flex-1 sm:flex-none"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Cadastrar Aluno
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/personal/create-training')}
            className="flex-1 sm:flex-none"
          >
            <Dumbbell className="h-4 w-4 mr-2" />
            Criar Treino
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/personal/corrections')}
            className="flex-1 sm:flex-none"
          >
            <Play className="h-4 w-4 mr-2" />
            Área de Correções
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/personal/analytics')}
            className="flex-1 sm:flex-none"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
        </div>

        {/* Students List */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Meus Alunos
            </CardTitle>
            <CardDescription>
              Gerencie seus alunos e acompanhe o progresso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum aluno cadastrado</h3>
                <p className="text-muted-foreground mb-4">
                  Comece cadastrando seu primeiro aluno
                </p>
                <Button variant="gradient" onClick={() => navigate('/personal/add-student')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Aluno
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <Card key={student.id} className="hover:shadow-medium transition-shadow cursor-pointer"
                        onClick={() => navigate(`/personal/student/${student.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(student.nome)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{student.nome}</h4>
                          
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="truncate">{student.email}</span>
                          </div>
                          
                          {student.telefone && (
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              <span>{student.telefone}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Início: {formatDate(student.data_inicio)}</span>
                          </div>
                        </div>
                      </div>
                      
                       <div className="mt-3 flex justify-between items-center">
                        <Badge variant="secondary">Ativo</Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/personal/create-training/${student.id}`);
                          }}
                        >
                          Criar Treino
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}