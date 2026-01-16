
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

const DB_FILE = 'database.sqlite';

let db: Database;

export const initDb = async () => {
    db = await open({
        filename: DB_FILE,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            password TEXT,
            name TEXT,
            avatar TEXT,
            role TEXT DEFAULT 'Student',
            major TEXT DEFAULT 'Undeclared',
            level INTEGER DEFAULT 1,
            xp INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            author_name TEXT,
            author_avatar TEXT,
            content TEXT,
            category TEXT,
            likes INTEGER DEFAULT 0,
            comments INTEGER DEFAULT 0,
            session_data TEXT,
            attachments TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS saved_posts (
            user_id TEXT,
            post_id TEXT,
            PRIMARY KEY (user_id, post_id),
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(post_id) REFERENCES posts(id)
        );

        CREATE TABLE IF NOT EXISTS comments (
            id TEXT PRIMARY KEY,
            post_id TEXT,
            user_id TEXT,
            user_name TEXT,
            user_avatar TEXT,
            content TEXT,
            parent_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(post_id) REFERENCES posts(id),
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(parent_id) REFERENCES comments(id)
        );

        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT,
            subject TEXT,
            content TEXT,
            is_ai_synthesized BOOLEAN,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS resources (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT,
            type TEXT,
            department TEXT,
            trimester TEXT,
            year TEXT,
            faculty TEXT,
            subject TEXT,
            file_path TEXT,
            text_content TEXT,
            text_content TEXT,
            source TEXT DEFAULT 'library',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            owner_id TEXT,
            owner_name TEXT,
            owner_avatar TEXT,
            title TEXT,
            description TEXT,
            trimester TEXT,
            year TEXT,
            status TEXT DEFAULT 'Open',
            tags TEXT, -- JSON array
            looking_for TEXT, -- JSON array
            members_needed INTEGER DEFAULT 1,
            likes INTEGER DEFAULT 0,
            comments INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(owner_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS project_members (
            project_id TEXT,
            user_id TEXT,
            user_name TEXT,
            user_avatar TEXT,
            student_id TEXT,
            role TEXT,
            PRIMARY KEY (project_id, user_id),
            FOREIGN KEY(project_id) REFERENCES projects(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS project_tasks (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            title TEXT,
            description TEXT,
            assigned_to TEXT,
            assigned_name TEXT,
            assigned_avatar TEXT,
            status TEXT DEFAULT 'Todo',
            due_date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(project_id) REFERENCES projects(id),
            FOREIGN KEY(assigned_to) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS project_updates (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            user_id TEXT,
            user_name TEXT,
            user_avatar TEXT,
            content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(project_id) REFERENCES projects(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS chats (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            chat_id TEXT,
            role TEXT,
            content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(chat_id) REFERENCES chats(id)
        );

        CREATE TABLE IF NOT EXISTS project_applications (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            user_id TEXT,
            user_name TEXT,
            user_avatar TEXT,
            student_id TEXT,
            phone_number TEXT,
            description TEXT,
            status TEXT DEFAULT 'Pending', -- Pending, Accepted, Rejected
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(project_id) REFERENCES projects(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `);

    // Migration for existing resources table to add text_content if missing
    // Migration for existing resources table to add text_content if missing
    try {
        await db.exec('ALTER TABLE resources ADD COLUMN text_content TEXT');
    } catch (e) {
        // Ignore error if column already exists
    }

    // Migration for source column
    try {
        await db.exec(`ALTER TABLE resources ADD COLUMN source TEXT DEFAULT 'library'`);
    } catch (e) {
        // Ignore error if column already exists
    }

    // Migration for projects columns
    try {
        await db.exec(`ALTER TABLE projects ADD COLUMN looking_for TEXT`);
    } catch (e) { }
    try {
        await db.exec(`ALTER TABLE projects ADD COLUMN members_needed INTEGER DEFAULT 1`);
    } catch (e) { }

    console.log('Tables created or verified.');

    // Seed Data Check
    const userCount = await db.get('SELECT count(*) as count FROM users');
    if (userCount.count === 0) {
        console.log('Seeding database...');
        // Seed Users
        await db.run(`INSERT INTO users (id, email, password, name, avatar, role, major, level, xp) VALUES 
            ('u_sys', 'admin@learnsphere.edu', 'admin123', 'System Admin', 'https://ui-avatars.com/api/?name=System+Admin&background=0D8ABC&color=fff', 'Administrator', 'IT Dept', 99, 99999),
            ('u_alex', 'alex@university.edu', 'password123', 'Alex Johnson', 'https://picsum.photos/seed/user1/40/40', 'Student', 'Computer Science', 12, 2450),
            ('u_sarah', 'sarah@university.edu', 'password123', 'Sarah Chen', 'https://picsum.photos/seed/sarah/40/40', 'Researcher', 'Physics', 15, 3200)`);

        // Seed Posts
        const sessionPayload = JSON.stringify({
            course_name: 'Advanced Calculus',
            topics: 'Multivariable Functions, Partials',
            start_time: 'Tomorrow 2 PM',
            meeting_link: 'https://meet.google.com/abc-xyz'
        });

        await db.run(`INSERT INTO posts (id, user_id, author_name, author_avatar, content, category, likes, comments, session_data, created_at) VALUES 
            ('p1', 'u_sys', 'System Admin', 'https://ui-avatars.com/api/?name=System+Admin&background=0D8ABC&color=fff', 'Welcome to LearnSphere! Connect, collaborate, and grow.', 'General', 150, 0, NULL, datetime('now', '-2 days')),
            ('p2', 'u_sarah', 'Sarah Chen', 'https://picsum.photos/seed/sarah/40/40', 'Just finished a marathon study session on Quantum Mechanics. 🧬📚', 'Study Strategy', 24, 1, NULL, datetime('now', '-5 hours')),
            ('p3', 'u_alex', 'Alex Johnson', 'https://picsum.photos/seed/user1/40/40', '', 'Session', 5, 0, ?, datetime('now', '-1 hour'))`,
            [sessionPayload]);

        // Seed Comments
        await db.run(`INSERT INTO comments (id, post_id, user_id, user_name, user_avatar, content, created_at) VALUES
            ('c1', 'p2', 'u_alex', 'Alex Johnson', 'https://picsum.photos/seed/user1/40/40', 'Those notes look great!', datetime('now', '-2 hours'))`);
        console.log('Database seeded successfully.');
    } else {
        console.log('Database already seeded.');
    }

    console.log('Database initialized');
};

export const getDb = () => db;
