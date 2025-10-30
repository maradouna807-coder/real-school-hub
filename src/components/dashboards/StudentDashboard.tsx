import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Award, CalendarCheck, CalendarX, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0 });

  useEffect(() => {
    if (user) {
      loadData();
      subscribeToUpdates();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load grades
    const { data: gradesData } = await supabase
      .from('grades')
      .select('*')
      .eq('student_code', user.code)
      .order('created_at', { ascending: false });

    if (gradesData) setGrades(gradesData);

    // Load attendance
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_code', user.code)
      .order('date', { ascending: false });

    if (attendanceData) {
      setAttendance(attendanceData);
      const present = attendanceData.filter(a => a.status === 'حاضر').length;
      const absent = attendanceData.filter(a => a.status === 'غائب').length;
      setStats({ present, absent });
    }
  };

  const subscribeToUpdates = () => {
    if (!user) return;

    const gradesChannel = supabase
      .channel('student-grades')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grades',
          filter: `student_code=eq.${user.code}`,
        },
        () => loadData()
      )
      .subscribe();

    const attendanceChannel = supabase
      .channel('student-attendance')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `student_code=eq.${user.code}`,
        },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gradesChannel);
      supabase.removeChannel(attendanceChannel);
    };
  };

  const isKindergarten = user?.group_type === 'روضة';

  return (
    <Layout title="لوحة الطالب">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>مرحبا {user?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">الصف</p>
                <p className="text-xl font-bold text-primary">{user?.class}</p>
              </div>
              <div className="p-4 bg-secondary/5 rounded-lg flex items-center gap-3">
                <CalendarCheck className="w-8 h-8 text-secondary" />
                <div>
                  <p className="text-sm text-muted-foreground">الحضور</p>
                  <p className="text-2xl font-bold text-secondary">{stats.present}</p>
                </div>
              </div>
              <div className="p-4 bg-destructive/5 rounded-lg flex items-center gap-3">
                <CalendarX className="w-8 h-8 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">الغياب</p>
                  <p className="text-2xl font-bold text-destructive">{stats.absent}</p>
                </div>
              </div>
              <div className="p-4 bg-accent/5 rounded-lg flex items-center gap-3">
                <Award className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">التقييمات</p>
                  <p className="text-2xl font-bold text-accent">{grades.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                {isKindergarten ? 'التقييمات' : 'الدرجات'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {grades.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد تقييمات حتى الآن
                  </p>
                ) : (
                  grades.map((grade) => (
                    <div
                      key={grade.id}
                      className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{grade.subject_key}</p>
                          <p className="text-sm text-muted-foreground">{grade.term}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-2xl font-bold text-primary">{grade.value}</p>
                          {!isKindergarten && <p className="text-xs text-muted-foreground">/20</p>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                سجل الحضور والغياب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {attendance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا يوجد سجل حتى الآن
                  </p>
                ) : (
                  attendance.slice(0, 20).map((record) => (
                    <div
                      key={record.id}
                      className={`p-3 rounded-lg ${
                        record.status === 'حاضر' 
                          ? 'bg-secondary/10 border border-secondary/20' 
                          : 'bg-destructive/10 border border-destructive/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {record.status === 'حاضر' ? (
                            <CalendarCheck className="w-4 h-4 text-secondary" />
                          ) : (
                            <CalendarX className="w-4 h-4 text-destructive" />
                          )}
                          <span className="font-medium">{record.status}</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm">
                            {format(new Date(record.date), 'PPP', { locale: ar })}
                          </p>
                          <p className="text-xs text-muted-foreground">{record.kind}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
