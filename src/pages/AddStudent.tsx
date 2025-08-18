import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, X } from 'lucide-react';

export default function AddStudent() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    data_inicio: new Date().toISOString().split('T')[0],
    anamnese: ''
  });
  const [photos, setPhotos] = useState<File[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (photos.length + newFiles.length > 5) {
        toast({
          title: "Limite excedido",
          description: "Máximo de 5 fotos permitidas",
          variant: "destructive"
        });
        return;
      }
      setPhotos(prev => [...prev, ...newFiles]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (studentId: string): Promise<string[]> => {
    const photoUrls: string[] = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const fileName = `${studentId}/photo_${i + 1}_${Date.now()}.${photo.name.split('.').pop()}`;
      
      const { data, error } = await supabase.storage
        .from('student-photos')
        .upload(fileName, photo);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('student-photos')
        .getPublicUrl(fileName);
      
      photoUrls.push(publicUrl);
    }
    
    return photoUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    
    try {
      // Create student record
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          ...formData,
          personal_id: profile.id,
          fotos_urls: []
        })
        .select()
        .single();
      
      if (studentError) throw studentError;

      // Upload photos if any
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await uploadPhotos(student.id);
        
        // Update student with photo URLs
        const { error: updateError } = await supabase
          .from('students')
          .update({ fotos_urls: photoUrls })
          .eq('id', student.id);
        
        if (updateError) throw updateError;
      }

      toast({
        title: "Aluno cadastrado",
        description: "Aluno cadastrado com sucesso!"
      });
      
      navigate('/personal/dashboard');
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar aluno",
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/personal/dashboard')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Cadastrar Novo Aluno</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Dados do Aluno</CardTitle>
            <CardDescription>
              Preencha as informações básicas do aluno
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="data_inicio">Data de Início *</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => handleInputChange('data_inicio', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="anamnese">Anamnese</Label>
                <Textarea
                  id="anamnese"
                  placeholder="Histórico médico, objetivos, limitações..."
                  value={formData.anamnese}
                  onChange={(e) => handleInputChange('anamnese', e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label>Fotos Posturais (máximo 5)</Label>
                <div className="mt-2">
                  <div className="flex items-center gap-4 mb-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                      id="photo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      disabled={photos.length >= 5}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Adicionar Fotos
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {photos.length}/5 fotos
                    </span>
                  </div>
                  
                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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
                  disabled={loading || !formData.nome || !formData.email}
                  className="flex-1"
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar Aluno'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}