-- Insert sample students
INSERT INTO students (student_id, student_name, grade, phone) VALUES
('h01001', '강민엽', '고등 1학년', '1097561279'),
('h01002', '강소율', '고등 1학년', '1043301135'),
('h01003', '김경호', '고등 1학년', '1032400486')
ON CONFLICT (student_id) DO NOTHING;
