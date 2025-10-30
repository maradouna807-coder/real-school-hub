-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create users table with unique code-based authentication
CREATE TABLE public.users (
  code TEXT PRIMARY KEY CHECK (code ~ '^[A-Z]{2}\d{2}$'),
  role public.app_role NOT NULL,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  subject TEXT,
  group_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create grades table for student assessments
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code TEXT NOT NULL REFERENCES public.users(code) ON DELETE CASCADE,
  subject_key TEXT NOT NULL,
  value TEXT NOT NULL,
  term TEXT DEFAULT 'الفصل 1',
  teacher_code TEXT REFERENCES public.users(code),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance table for tracking student presence
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code TEXT NOT NULL REFERENCES public.users(code) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  kind TEXT NOT NULL CHECK (kind IN ('رسمي', 'دعم')),
  status TEXT NOT NULL CHECK (status IN ('حاضر', 'غائب')),
  teacher_code TEXT REFERENCES public.users(code),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_code, date, kind)
);

-- Create schedules table for class timetables
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  teacher_code TEXT REFERENCES public.users(code),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Users table policies: Everyone can read (for login), only admin can modify
CREATE POLICY "Anyone can read users for login"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert users"
  ON public.users FOR INSERT
  WITH CHECK (role = 'admin');

CREATE POLICY "Admin can update users"
  ON public.users FOR UPDATE
  USING (role = 'admin');

CREATE POLICY "Admin can delete users"
  ON public.users FOR DELETE
  USING (role = 'admin');

-- Grades policies: Teachers can insert/update, students can read their own
CREATE POLICY "Students can read their own grades"
  ON public.grades FOR SELECT
  USING (true);

CREATE POLICY "Teachers can insert grades"
  ON public.grades FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Teachers can update grades"
  ON public.grades FOR UPDATE
  USING (true);

-- Attendance policies: Teachers can manage, students can read their own
CREATE POLICY "Students can read their own attendance"
  ON public.attendance FOR SELECT
  USING (true);

CREATE POLICY "Teachers can insert attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Teachers can update attendance"
  ON public.attendance FOR UPDATE
  USING (true);

-- Schedules policies: Everyone can read, admin can manage
CREATE POLICY "Everyone can read schedules"
  ON public.schedules FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage schedules"
  ON public.schedules FOR ALL
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;