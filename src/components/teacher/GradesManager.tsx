import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface GradesManagerProps {
  students: any[];
}

const GradesManager = ({ students }: GradesManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [grades, setGrades] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  const isKindergarten = user?.class === 'الروضة';

  const kindergartenSubjects = [
    { key: 'قرآن', label: 'قرآن' },
    { key: 'أذكار', label: 'أذكار' },
    { key: 'أحاديث', label: 'أحاديث' },
    { key: 'رسم', label: 'رسم' },
  ];

  const assessmentLevels = [
    'ممتاز',
    'جيد جداً',
    'جيد',
    'مقبول',
    'ضعيف',
  ];

  const handleSaveGrade = async (studentCode: string, subjectKey: string, value: string) => {
    if (!value) return;

    setSaving(true);
    const { error } = await supabase.from('grades').insert([{
      student_code: studentCode,
      subject_key: subjectKey,
      value,
      teacher_code: user?.code,
    }]);

    if (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الدرجة',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'تم بنجاح',
        description: 'تم حفظ الدرجة',
      });
      setGrades({ ...grades, [`${studentCode}-${subjectKey}`]: '' });
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

  if (isKindergarten) {
    return (
      <div className="space-y-6">
        {students.map((student) => (
          <Card key={student.code}>
            <CardHeader>
              <CardTitle className="text-lg">{student.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kindergartenSubjects.map((subject) => (
                  <div key={subject.key} className="space-y-2">
                    <label className="text-sm font-medium">{subject.label}</label>
                    <div className="flex gap-2">
                      <Select
                        value={grades[`${student.code}-${subject.key}`] || ''}
                        onValueChange={(v) => setGrades({ ...grades, [`${student.code}-${subject.key}`]: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر التقييم" />
                        </SelectTrigger>
                        <SelectContent>
                          {assessmentLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => handleSaveGrade(
                          student.code,
                          subject.key,
                          grades[`${student.code}-${subject.key}`]
                        )}
                        disabled={!grades[`${student.code}-${subject.key}`] || saving}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدخال الدرجات - {user?.subject}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {students.map((student) => (
            <div key={student.code} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-muted-foreground">{student.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="20"
                  placeholder="0-20"
                  value={grades[student.code] || ''}
                  onChange={(e) => setGrades({ ...grades, [student.code]: e.target.value })}
                  className="w-24 text-center"
                />
                <span className="text-muted-foreground">/20</span>
                <Button
                  size="sm"
                  onClick={() => handleSaveGrade(student.code, user?.subject || 'درجة', grades[student.code])}
                  disabled={!grades[student.code] || saving}
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GradesManager;
