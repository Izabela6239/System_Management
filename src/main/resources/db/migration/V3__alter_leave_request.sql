ALTER TABLE leave_request
    ADD COLUMN admin_id BIGINT NULL,
ADD CONSTRAINT fk_leave_admin FOREIGN KEY (admin_id) REFERENCES admin(id);
