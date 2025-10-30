import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, GraduationCap } from 'lucide-react';

const Login = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate code format
    if (!/^[A-Z]{2}\d{2}$/i.test(code)) {
      toast({
        title: 'خطأ',
        description: 'يجب أن يكون الكود مكون من حرفين ورقمين (مثال: AD01)',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await login(code.toUpperCase());
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'خطأ في تسجيل الدخول',
        description: 'كود الدخول غير صحيح. يرجى التحقق والمحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">مدرسة النبي اليتيم</CardTitle>
          <CardDescription className="text-base">
            أدخل كود الدخول الخاص بك للوصول إلى المنصة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">كود الدخول</label>
              <Input
                type="text"
                placeholder="مثال: AD01"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={4}
                className="text-center text-2xl tracking-widest font-bold"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground text-center">
                حرفان + رقمان (مثال: AD01، KG05، SN05)
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || code.length !== 4}>
              {loading ? 'جاري التحقق...' : 'دخول'}
            </Button>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <BookOpen className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong>نسيت الكود؟</strong> يرجى التواصل مع الإدارة لاستعادة كود الدخول الخاص بك.
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
