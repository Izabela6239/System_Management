-- angajati & skilluri
CREATE TABLE employee (
id BIGINT PRIMARY KEY AUTO_INCREMENT,
name VARCHAR(120) NOT NULL,
email VARCHAR(160) UNIQUE,
role ENUM('ADMIN','EMPLOYEE') NOT NULL,
hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
seniority ENUM('JUNIOR','MID','SENIOR') DEFAULT 'JUNIOR',
active TINYINT(1) DEFAULT 1
);

CREATE TABLE skill (
id BIGINT PRIMARY KEY AUTO_INCREMENT,
name VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE employee_skill (
employee_id BIGINT, skill_id BIGINT,
PRIMARY KEY(employee_id, skill_id),
FOREIGN KEY (employee_id) REFERENCES employee(id),
FOREIGN KEY (skill_id) REFERENCES skill(id)
);

-- taskuri
CREATE TABLE task (
id BIGINT PRIMARY KEY AUTO_INCREMENT,
title VARCHAR(200) NOT NULL,
type VARCHAR(80),
difficulty TINYINT NOT NULL, -- 1..5
required_skills_json JSON,   -- simplu la început
planned_duration_min INT,    -- durata prestabilită
predicted_duration_min INT,  -- setat de AI (opțional)
deadline DATETIME,
priority TINYINT DEFAULT 3,
revenue DECIMAL(10,2) DEFAULT 0,
other_costs DECIMAL(10,2) DEFAULT 0,
status ENUM('NEW','ASSIGNED','ACCEPTED','REJECTED','IN_PROGRESS','DONE') DEFAULT 'NEW'
);

-- asocieri & execuție
CREATE TABLE assignment (
id BIGINT PRIMARY KEY AUTO_INCREMENT,
task_id BIGINT NOT NULL,
employee_id BIGINT NOT NULL,
assigned_at DATETIME,
accepted_at DATETIME,
started_at DATETIME,
finished_at DATETIME,
actual_duration_min INT,
admin_grade TINYINT, -- 0..10
valid TINYINT(1) DEFAULT 1,
FOREIGN KEY (task_id) REFERENCES task(id),
FOREIGN KEY (employee_id) REFERENCES employee(id)
);

-- concedii
CREATE TABLE leave_request (
id BIGINT PRIMARY KEY AUTO_INCREMENT,
employee_id BIGINT NOT NULL,
from_date DATE NOT NULL,
to_date DATE NOT NULL,
reason VARCHAR(255),
status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
admin_comment VARCHAR(255),
FOREIGN KEY (employee_id) REFERENCES employee(id)
);

-- istoric agregat pt. AI & grafice
CREATE TABLE ai_task_history (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 task_id BIGINT,
 employee_id BIGINT,
 planned_duration INT,
 predicted_duration INT,
 actual_duration INT,
 grade TINYINT,
 difficulty TINYINT,
 type VARCHAR(80),
 revenue DECIMAL(10,2),
 other_costs DECIMAL(10,2),
 finished_at DATETIME
);