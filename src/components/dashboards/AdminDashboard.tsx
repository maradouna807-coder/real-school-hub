import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [newUser, setNewUser] = useState({
    code: '',
    role: '',
    name: '',
    class: '',
    subject: '',
    group_type: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setUsers(data);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!/^[A-Z]{2}\d{2}$/.test(newUser.code)) {
      toast({
        title: 'خطأ',
        description: 'الكود يجب أن يكون حرفين + رقمين',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('users').insert([{
      code: newUser.code.toUpperCase(),
      role: newUser.role as 'admin' | 'teacher' | 'student',
      name: newUser.name,
      class: newUser.class,
      subject: newUser.subject || null,
      group_type: newUser.group_type || null,
    }]);

    if (error) {
      toast({
        title: 'خطأ',
        description: error.message.includes('duplicate') 
          ? 'الكود موجود بالفعل' 
          : 'حدث خطأ أثناء إنشاء المستخدم',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء المستخدم بنجاح',
      });
      setNewUser({ code: '', role: '', name: '', class: '', subject: '', group_type: '' });
      loadUsers();
    }
    setLoading(false);
  };

  const handleDeleteUser = async (code: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    const { error } = await supabase.from('users').delete().eq('code', code);
    
    if (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف المستخدم',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'تم بنجاح',
        description: 'تم حذف المستخدم',
      });
      loadUsers();
    }
  };

  return (
    <Layout title="لوحة الإدارة">
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
          <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                إضافة مستخدم جديد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الكود (حرفين + رقمين)</Label>
                    <Input
                      placeholder="مثال: AD01"
                      value={newUser.code}
                      onChange={(e) => setNewUser({ ...newUser, code: e.target.value.toUpperCase() })}
                      maxLength={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>الدور</Label>
                    <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدور" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">إدارة</SelectItem>
                        <SelectItem value="teacher">أستاذ</SelectItem>
                        <SelectItem value="student">طالب</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>الاسم الكامل</Label>
                    <Input
                      placeholder="الاسم"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>الصف/المستوى</Label>
                    <Select value={newUser.class} onValueChange={(v) => setNewUser({ ...newUser, class: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الصف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="الروضة">الروضة</SelectItem>
                        <SelectItem value="الخامسة ابتدائي">الخامسة ابتدائي</SelectItem>
                        <SelectItem value="الرابعة متوسط">الرابعة متوسط</SelectItem>
                        <SelectItem value="الثالثة ثانوي">الثالثة ثانوي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newUser.role === 'teacher' && (
                    <div className="space-y-2">
                      <Label>المادة</Label>
                      <Input
                        placeholder="مثال: اللغة العربية"
                        value={newUser.subject}
                        onChange={(e) => setNewUser({ ...newUser, subject: e.target.value })}
                      />
                    </div>
                  )}

                  {newUser.role === 'student' && (
                    <div className="space-y-2">
                      <Label>النوع (دعم/عادي)</Label>
                      <Select value={newUser.group_type} onValueChange={(v) => setNewUser({ ...newUser, group_type: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="روضة">روضة</SelectItem>
                          <SelectItem value="دعم">دعم</SelectItem>
                          <SelectItem value="عادي">عادي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  {loading ? 'جاري الإضافة...' : 'إضافة مستخدم'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                قائمة المستخدمين ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.code}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.code} • {user.role === 'admin' ? 'إدارة' : user.role === 'teacher' ? 'أستاذ' : 'طالب'} • {user.class}
                        {user.subject && ` • ${user.subject}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(user.code)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>إجمالي المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">{users.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>الأساتذة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-secondary">
                  {users.filter(u => u.role === 'teacher').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>الطلبة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-accent">
                  {users.filter(u => u.role === 'student').length}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default AdminDashboard;
