import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GradesManager from '@/components/teacher/GradesManager';
import AttendanceManager from '@/components/teacher/AttendanceManager';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Calendar } from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    loadStudents();
  }, [user]);

  const loadStudents = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .eq('class', user.class)
      .order('name');

    if (data) {
      setStudents(data);
    }
  };

  return (
    <Layout title="لوحة الأستاذ">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>مرحبا {user?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">الصف</p>
                <p className="text-2xl font-bold text-primary">{user?.class}</p>
              </div>
              <div className="p-4 bg-secondary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">المادة</p>
                <p className="text-2xl font-bold text-secondary">{user?.subject || 'متعدد'}</p>
              </div>
              <div className="p-4 bg-accent/5 rounded-lg">
                <p className="text-sm text-muted-foreground">عدد الطلبة</p>
                <p className="text-2xl font-bold text-accent">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="grades" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="grades" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              الدرجات
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              الحضور والغياب
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grades">
            <GradesManager students={students} />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceManager students={students} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;
