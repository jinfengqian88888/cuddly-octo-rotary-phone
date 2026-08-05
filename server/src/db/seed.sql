-- 初始管理员账号
-- 用户名: admin  密码: admin123 (bcrypt hash)
INSERT INTO users (username, password_hash, real_name, role)
VALUES ('admin', '$2a$10$placeholder_hash_will_be_replaced', '管理员', 'admin');
