-- SQL Database Schema Reference
-- This file shows the equivalent SQL schema structure for reference
-- Note: This project uses MongoDB, but this SQL schema can be used if migrating to PostgreSQL/MySQL

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('employee', 'manager')),
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_role ON users(role);

-- Attendance Table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'half-day')),
    total_hours DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);

-- Function to calculate total hours
CREATE OR REPLACE FUNCTION calculate_total_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
        NEW.total_hours := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate total hours
CREATE TRIGGER trigger_calculate_hours
    BEFORE INSERT OR UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION calculate_total_hours();

-- Sample Queries

-- Get user with attendance count
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    COUNT(a.id) as total_attendance_records
FROM users u
LEFT JOIN attendance a ON u.id = a.user_id
GROUP BY u.id, u.name, u.email, u.role;

-- Get monthly attendance summary for a user
SELECT 
    DATE_TRUNC('month', date) as month,
    COUNT(*) FILTER (WHERE status = 'present') as present_days,
    COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
    COUNT(*) FILTER (WHERE status = 'late') as late_days,
    COUNT(*) FILTER (WHERE status = 'half-day') as half_days,
    SUM(total_hours) as total_hours
FROM attendance
WHERE user_id = 1
    AND date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY DATE_TRUNC('month', date);

-- Get today's attendance for all employees
SELECT 
    u.name,
    u.employee_id,
    u.department,
    a.check_in_time,
    a.check_out_time,
    a.status,
    a.total_hours
FROM users u
LEFT JOIN attendance a ON u.id = a.user_id 
    AND a.date = CURRENT_DATE
WHERE u.role = 'employee'
ORDER BY u.name;

-- Get team attendance summary by department
SELECT 
    u.department,
    COUNT(DISTINCT u.id) as total_employees,
    COUNT(a.id) FILTER (WHERE a.status = 'present') as present_count,
    COUNT(a.id) FILTER (WHERE a.status = 'absent') as absent_count,
    COUNT(a.id) FILTER (WHERE a.status = 'late') as late_count,
    SUM(a.total_hours) as total_hours
FROM users u
LEFT JOIN attendance a ON u.id = a.user_id
    AND a.date >= DATE_TRUNC('month', CURRENT_DATE)
    AND a.date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
WHERE u.role = 'employee'
GROUP BY u.department;

-- Get weekly attendance trend
SELECT 
    DATE_TRUNC('day', date) as day,
    COUNT(*) FILTER (WHERE check_in_time IS NOT NULL) as present_count,
    COUNT(*) FILTER (WHERE check_in_time IS NULL) as absent_count
FROM attendance
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
    AND date < CURRENT_DATE
GROUP BY DATE_TRUNC('day', date)
ORDER BY day;

-- Insert sample data
INSERT INTO users (name, email, password, role, employee_id, department) VALUES
('John Manager', 'manager@company.com', '$2a$10$hashedpassword', 'manager', 'MGR001', 'Management'),
('Alice Johnson', 'alice@company.com', '$2a$10$hashedpassword', 'employee', 'EMP001', 'Engineering'),
('Bob Smith', 'bob@company.com', '$2a$10$hashedpassword', 'employee', 'EMP002', 'Engineering');

-- Insert sample attendance
INSERT INTO attendance (user_id, date, check_in_time, check_out_time, status) VALUES
(2, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '8 hours', 'present'),
(3, CURRENT_DATE, CURRENT_TIMESTAMP + INTERVAL '30 minutes', CURRENT_TIMESTAMP + INTERVAL '8 hours', 'late');

