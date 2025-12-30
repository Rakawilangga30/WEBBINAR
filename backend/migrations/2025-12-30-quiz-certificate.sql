-- Quiz & Certificate System Migration
-- Created: 2025-12-30

-- Event certificate settings
CREATE TABLE IF NOT EXISTS event_certificates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT NOT NULL UNIQUE,
    is_enabled TINYINT(1) DEFAULT 0,
    min_score_percent INT DEFAULT 80,
    certificate_title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Quiz per session (optional, max 10 questions)
CREATE TABLE IF NOT EXISTS session_quizzes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL UNIQUE,
    title VARCHAR(255),
    is_enabled TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Quiz questions (max 10 per quiz)
CREATE TABLE IF NOT EXISTS quiz_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    quiz_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500),
    option_d VARCHAR(500),
    correct_option CHAR(1) NOT NULL,
    order_index INT DEFAULT 0,
    FOREIGN KEY (quiz_id) REFERENCES session_quizzes(id) ON DELETE CASCADE
);

-- User quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    quiz_id BIGINT NOT NULL,
    score_percent DECIMAL(5,2) NOT NULL,
    answers JSON,
    passed TINYINT(1) DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES session_quizzes(id) ON DELETE CASCADE
);

-- User certificates (when all quizzes passed)
CREATE TABLE IF NOT EXISTS user_certificates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    total_score_percent DECIMAL(5,2) NOT NULL,
    certificate_code VARCHAR(50) UNIQUE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cert (user_id, event_id)
);
