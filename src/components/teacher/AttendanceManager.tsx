import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CalendarCheck, CalendarX, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AttendanceManagerProps {
  students: any[];
}

const AttendanceManager = ({ students }: AttendanceManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [kind, setKind] = useState<'رسمي' | 'دعم'>('رسمي');
  const [attendance, setAttendance] = useState<{ [key: string]: 'حاضر' | 'غائب' }>({});
  const [saving, setSaving] = useState(false);

  const handleMarkAll = (status: 'حاضر' | 'غائب') => {
    const newAttendance: { [key: string]: 'حاضر' | 'غائب' } = {};
    students.forEach((student) => {
      newAttendance[student.code] = status;
    });
    setAttendance(newAttendance);
  };

  const handleSave = async (studentCode: string) => {
    const status = attendance[studentCode];
    if (!status) return;

    setSaving(true);
    const { error } = await supabase.from('attendance').upsert([{
      student_code: studentCode,
      date,
      kind,
      status,
      teacher_code: user?.code,
    }], {
      onConflict: 'student_code,date,kind',
    });

    if (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الحضور',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'تم بنجاح',
        description: 'تم تسجيل الحضور',
      });
    }
    setSaving(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    
    const records = students
      .filter(student => attendance[student.code])
      .map(student => ({
        student_code: student.code,
        date,
        kind,
        status: attendance[student.code],
        teacher_code: user?.code,
      }));

    if (records.length === 0) {
      toast({
        title: 'تنبيه',
        description: 'لم يتم تحديد أي حضور',
        variant: 'destructive',
      });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('attendance').upsert(records, {
      onConflict: 'student_code,date,kind',
    });

    if (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الحضور',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'تم بنجاح',
        description: `تم تسجيل حضور ${records.length} طالب`,
      });
      setAttendance({});
    }
    setSaving(false);
  };

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          لا يوجد طلاب في هذا الصف
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          تسجيل الحضور والغياب
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">التاريخ</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">نوع الحصة</label>
            <Select value={kind} onValueChange={(v: any) => setKind(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="رسمي">رسمي</SelectItem>
                <SelectItem value="دعم">دعم</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">إجراءات سريعة</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll('حاضر')}
                className="flex-1"
              >
                <CalendarCheck className="w-4 h-4 ml-1" />
                الكل حاضر
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll('غائب')}
                className="flex-1"
              >
                <CalendarX className="w-4 h-4 ml-1" />
                الكل غائب
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {students.map((student) => (
            <div key={student.code} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-muted-foreground">{student.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={attendance[student.code] || ''}
                  onValueChange={(v: any) => setAttendance({ ...attendance, [student.code]: v })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="حاضر">حاضر</SelectItem>
                    <SelectItem value="غائب">غائب</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => handleSave(student.code)}
                  disabled={!attendance[student.code] || saving}
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={handleSaveAll} disabled={saving} className="w-full">
          <Save className="w-4 h-4 ml-2" />
          حفظ الجميع
        </Button>
      </CardContent>
    </Card>
  );
};

export default AttendanceManager;
