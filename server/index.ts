
import express from 'express';
import cors from 'cors';
import { initDb, getDb } from './db';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { department, year, subject } = req.body;
        // Sanitize path components to prevent security issues
        const safeDept = (department || 'General').replace(/[^a-z0-9]/gi, '_');
        const safeYear = (year || 'Unknown').replace(/[^a-z0-9]/gi, '_');
        const safeSubj = (subject || 'Misc').replace(/[^a-z0-9]/gi, '_');

        const targetDir = path.join(uploadsDir, 'resources', safeDept, safeYear, safeSubj);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        // Keep original extension, sanitize name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_');
        cb(null, name + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage });

const PORT = 3001;

// Helper to map DB row to Frontend Post
const mapPost = (p: any, savedIds: Set<string> = new Set()) => ({
    id: p.id,
    author: p.author_name,
    authorId: p.user_id,
    avatar: p.author_avatar,
    content: p.content,
    category: p.category,
    likes: p.likes,
    comments: p.comments,
    timestamp: p.created_at,
    sessionData: p.session_data ? JSON.parse(p.session_data) : undefined,
    attachments: p.attachments ? JSON.parse(p.attachments) : [],
    isSaved: savedIds.has(p.id)
});

// POSTS API
app.get('/api/posts', async (req, res) => {
    const db = getDb();
    const userId = req.query.userId as string; // Check if user calls to see 'saved' status

    const posts = await db.all('SELECT * FROM posts ORDER BY created_at DESC');

    let savedIds = new Set<string>();
    if (userId) {
        const saved = await db.all('SELECT post_id FROM saved_posts WHERE user_id = ?', userId);
        saved.forEach(s => savedIds.add(s.post_id));
    }

    res.json(posts.map(p => mapPost(p, savedIds)));
});

app.post('/api/posts', async (req, res) => {
    const db = getDb();
    const { authorId, author, avatar, content, category, sessionData, attachments } = req.body;
    const id = uuidv4();

    try {
        await db.run(
            `INSERT INTO posts (id, user_id, author_name, author_avatar, content, category, session_data, attachments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [id, authorId, author, avatar, content, category, sessionData ? JSON.stringify(sessionData) : null, attachments ? JSON.stringify(attachments) : null]
        );

        // Return updated list? Or just the new one? Let's return list for simplicity as per prior pattern
        const posts = await db.all('SELECT * FROM posts ORDER BY created_at DESC');
        res.json(posts.map(p => mapPost(p)));
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.put('/api/posts/:id', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { content } = req.body;
    try {
        await db.run('UPDATE posts SET content = ? WHERE id = ?', [content, id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.delete('/api/posts/:id', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    try {
        await db.run('DELETE FROM posts WHERE id = ?', id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.post('/api/posts/:id/like', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    await db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', id);
    const updated = await db.all('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(updated.map(p => mapPost(p)));
});

app.post('/api/posts/:id/save', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { userId } = req.body;
    try {
        // Toggle save: check if exists
        const existing = await db.get('SELECT * FROM saved_posts WHERE user_id = ? AND post_id = ?', [userId, id]);
        if (existing) {
            await db.run('DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?', [userId, id]);
        } else {
            await db.run('INSERT INTO saved_posts (user_id, post_id) VALUES (?, ?)', [userId, id]);
        }

        // Return updated saved list?
        const saved = await db.all('SELECT post_id FROM saved_posts WHERE user_id = ?', userId);
        res.json(saved.map(s => s.post_id));
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// NOTES API
app.get('/api/notes', async (req, res) => {
    const db = getDb();
    const notes = await db.all('SELECT * FROM notes ORDER BY updated_at DESC');
    res.json(notes);
});

app.post('/api/notes', async (req, res) => {
    const db = getDb();
    const { title, subject, content, isAiSynthesized } = req.body;
    const id = uuidv4();
    await db.run(
        `INSERT INTO notes (id, user_id, title, subject, content, is_ai_synthesized, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [id, 'u_me', title, subject, content, isAiSynthesized]
    );
    const newNotes = await db.all('SELECT * FROM notes ORDER BY updated_at DESC');
    res.json(newNotes);
});


// COMMENTS API
app.get('/api/posts/:id/comments', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const comments = await db.all('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC', id);
    res.json(comments);
});

app.post('/api/posts/:id/comments', async (req, res) => {
    const db = getDb();
    const { id: postId } = req.params;
    const { userId, userName, userAvatar, content } = req.body;
    const commentId = uuidv4();

    try {
        await db.run(
            `INSERT INTO comments (id, post_id, user_id, user_name, user_avatar, content, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
            [commentId, postId, userId, userName, userAvatar, content]
        );
        // Update comment count on post (optional for performance, but good for UI)
        await db.run('UPDATE posts SET comments = comments + 1 WHERE id = ?', postId);

        const newComments = await db.all('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC', postId);
        res.json(newComments);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// AUTH API (Real)
app.get('/api/auth/me', async (req, res) => {
    // In a real app, verify JWT token here. 
    // For this prototype, we rely on client sending user ID or just return 401 if not implementing sessions yet.
    // Client should rely on stored user object for now after login.
    res.status(401).json({ error: 'Session management not implemented' });
});

app.post('/api/auth/login', async (req, res) => {
    const db = getDb();
    const { email, password } = req.body;

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
        if (user) {
            // Remove password from response
            const { password, ...safeUser } = user;
            res.json(safeUser);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const db = getDb();
    const { name, email, password } = req.body;
    const id = uuidv4();
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    try {
        const existing = await db.get('SELECT id FROM users WHERE email = ?', email);
        if (existing) {
            return res.status(400).json({ error: 'User already exists' });
        }

        await db.run(
            `INSERT INTO users (id, email, password, name, avatar, level, xp) VALUES (?, ?, ?, ?, ?, 1, 0)`,
            [id, email, password, name, avatar]
        );

        const user = await db.get('SELECT * FROM users WHERE id = ?', id);
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// RESOURCES API
app.get('/api/resources', async (req, res) => {
    const db = getDb();
    const { department, trimester, year, faculty, subject, type } = req.query;

    let query = 'SELECT * FROM resources WHERE 1=1';
    const params: any[] = [];

    if (department && department !== 'All') {
        query += ' AND department = ?';
        params.push(department);
    }
    if (trimester && trimester !== 'All') {
        query += ' AND trimester = ?';
        params.push(trimester);
    }
    if (year && year !== 'All') {
        query += ' AND year = ?';
        params.push(year);
    }
    if (faculty && faculty !== 'All') {
        query += ' AND faculty = ?';
        params.push(faculty);
    }
    if (subject && subject !== 'All') {
        query += ' AND subject LIKE ?';
        params.push(`%${subject}%`);
    }
    if (type && type !== 'All') {
        query += ' AND type = ?';
        params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    try {
        const resources = await db.all(query, params);
        res.json(resources);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});


app.post('/api/resources', upload.single('file'), async (req, res) => {
    console.log('Received upload request');
    console.log('Body:', req.body);
    console.log('File:', req.file);

    const db = getDb();
    const { title, type, department, trimester, year, faculty, subject, userId } = req.body;
    const file = req.file;

    if (!file) {
        console.error('No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Relative path for frontend access
    const relativePath = '/uploads/' + path.relative(uploadsDir, file.path).replace(/\\/g, '/');
    const id = uuidv4();

    try {
        await db.run(
            `INSERT INTO resources (id, user_id, title, type, department, trimester, year, faculty, subject, file_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [id, userId || 'u_me', title, type, department, trimester, year, faculty, subject, relativePath]
        );
        console.log('Resource saved to DB:', id);
        res.json({ success: true, id, file_path: relativePath });
    } catch (e) {
        console.error('DB Error during resource upload:', e);
        res.status(500).json({ error: (e as Error).message });
    }
});

// INIT
initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Keep process alive hack (in case app.listen doesnt holding it)
setInterval(() => { }, 60000);
