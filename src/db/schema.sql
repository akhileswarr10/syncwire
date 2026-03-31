CREATE TABLE IF NOT EXISTS meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    transcript LONGTEXT,
    date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT,
    assignee_email VARCHAR(255),
    description TEXT,
    detailed_context TEXT,
    deadline DATETIME,
    email_status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    task_status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);
