
import express from 'express';
import cors from 'cors';
import { initDb, getDb } from './db';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParseLib = require('pdf-parse');
// Check if it's the standard export or the object with PDFParse
const pdfParse = typeof pdfParseLib === 'function' ? pdfParseLib : (pdfParseLib.PDFParse || pdfParseLib.default || pdfParseLib);
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '' });

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
    isSaved: savedIds.has(p.id),
    authorStudentId: p.authorStudentId,
    authorEmail: p.authorEmail,
    authorIsIdVisible: p.authorIsIdVisible,
    authorIsEmailVisible: p.authorIsEmailVisible
});

// USER API
app.get('/api/users/:id', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const user = await db.get('SELECT * FROM users WHERE id = ?', id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...safeUser } = user;

    // Map SQLite 0/1 to boolean and snake_case to camelCase
    res.json({
        ...safeUser,
        studentId: safeUser.student_id,
        isIdVisible: !!safeUser.isIdVisible,
        isEmailVisible: !!safeUser.isEmailVisible
    });
});

app.put('/api/users/:id', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { name, avatar, role, major, studentId, isIdVisible, isEmailVisible } = req.body;
    try {
        await db.run(
            'UPDATE users SET name = ?, avatar = ?, role = ?, major = ?, student_id = ?, isIdVisible = ?, isEmailVisible = ? WHERE id = ?',
            [name, avatar, role, major, studentId, isIdVisible ? 1 : 0, isEmailVisible ? 1 : 0, id]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Update user error:', e);
        res.status(500).json({ error: (e as Error).message });
    }
});

// POSTS API
app.get('/api/posts', async (req, res) => {
    const db = getDb();
    const userId = req.query.userId as string; // Check if user calls to see 'saved' status

    // Join with users table to get latest author info and visibility settings
    const posts = await db.all(`
        SELECT p.*, 
               u.name as current_author_name, 
               u.avatar as current_author_avatar,
               u.student_id as author_student_id,
               u.email as author_email,
               u.isIdVisible as author_is_id_visible,
               u.isEmailVisible as author_is_email_visible
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    `);

    // Fetch Likes
    const likes = await db.all('SELECT post_id, user_id FROM post_likes');
    const likesMap = new Map<string, string[]>();
    likes.forEach(l => {
        if (!likesMap.has(l.post_id)) likesMap.set(l.post_id, []);
        likesMap.get(l.post_id)?.push(l.user_id);
    });

    let savedIds = new Set<string>();
    if (userId) {
        const saved = await db.all('SELECT post_id FROM saved_posts WHERE user_id = ?', userId);
        saved.forEach(s => savedIds.add(s.post_id));
    }

    res.json(posts.map(p => ({
        ...mapPost({
            ...p,
            // Override with latest user data if available via join
            author_name: p.current_author_name || p.author_name,
            author_avatar: p.current_author_avatar || p.author_avatar,
            authorStudentId: p.author_student_id,
            authorEmail: p.author_email,
            authorIsIdVisible: !!p.author_is_id_visible,
            authorIsEmailVisible: !!p.author_is_email_visible
        }, savedIds),
        likedBy: likesMap.get(p.id) || []
    })));
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
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: 'User ID required' });

    try {
        // Check if already liked
        const existing = await db.get('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [id, userId]);

        // Get post details for notification
        const post = await db.get('SELECT user_id, author_name FROM posts WHERE id = ?', id);
        const user = await db.get('SELECT name, avatar FROM users WHERE id = ?', userId);

        if (existing) {
            // Unlike
            await db.run('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [id, userId]);
            await db.run('UPDATE posts SET likes = MAX(0, likes - 1) WHERE id = ?', id);
        } else {
            // Like
            await db.run('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [id, userId]);
            await db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', id);

            // Create notification if not liking own post
            if (post && post.user_id !== userId) {
                await createNotification({
                    userId: post.user_id,
                    type: 'like',
                    title: 'New Like',
                    message: `${user.name} liked your post`,
                    postId: id,
                    actorId: userId,
                    actorName: user.name,
                    actorAvatar: user.avatar
                });
            }
        }

        // Get updated post with likedBy
        const posts = await db.all('SELECT * FROM posts ORDER BY created_at DESC');

        // Fetch likedBy for all posts (efficiently?) or just map properly
        const likes = await db.all('SELECT post_id, user_id FROM post_likes');
        const likesMap = new Map<string, string[]>();
        likes.forEach(l => {
            if (!likesMap.has(l.post_id)) likesMap.set(l.post_id, []);
            likesMap.get(l.post_id)?.push(l.user_id);
        });

        const mappedPosts = posts.map(p => ({
            ...mapPost(p),
            likedBy: likesMap.get(p.id) || []
        }));

        res.json(mappedPosts);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
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
    const { userId, userName, userAvatar, content, parentId } = req.body;
    const commentId = uuidv4();

    try {
        await db.run(
            `INSERT INTO comments (id, post_id, user_id, user_name, user_avatar, content, parent_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [commentId, postId, userId, userName, userAvatar, content, parentId || null]
        );
        // Update comment count on post (optional for performance, but good for UI)
        await db.run('UPDATE posts SET comments = comments + 1 WHERE id = ?', postId);

        // Get post details for notification
        const post = await db.get('SELECT user_id FROM posts WHERE id = ?', postId);

        // Create notification for post author (if not commenting on own post)
        if (post && post.user_id !== userId) {
            await createNotification({
                userId: post.user_id,
                type: 'comment',
                title: 'New Comment',
                message: `${userName} commented on your post`,
                postId: postId,
                actorId: userId,
                actorName: userName,
                actorAvatar: userAvatar
            });
        }

        // If it's a reply, also notify the parent comment author
        if (parentId) {
            const parentComment = await db.get('SELECT user_id, user_name FROM comments WHERE id = ?', parentId);
            if (parentComment && parentComment.user_id !== userId) {
                await createNotification({
                    userId: parentComment.user_id,
                    type: 'comment',
                    title: 'New Reply',
                    message: `${userName} replied to your comment`,
                    postId: postId,
                    actorId: userId,
                    actorName: userName,
                    actorAvatar: userAvatar
                });
            }
        }

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
            res.json({
                ...safeUser,
                studentId: safeUser.student_id,
                isIdVisible: !!safeUser.isIdVisible,
                isEmailVisible: !!safeUser.isEmailVisible
            });
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
        res.json({
            ...safeUser,
            studentId: safeUser.student_id,
            isIdVisible: !!safeUser.isIdVisible,
            isEmailVisible: !!safeUser.isEmailVisible
        });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// RESOURCES API
app.get('/api/resources', async (req, res) => {
    const db = getDb();
    const { department, trimester, year, faculty, subject, type, source } = req.query;

    let query = 'SELECT * FROM resources WHERE 1=1';
    const params: any[] = [];

    // Default to 'library' source if not specified.
    // If source parameter is present, use it (could be 'chat', 'library', or 'all' logic if we implemented it).
    // Here we strictly filter by source if provided, or default to NOT 'chat' (so null/library are shown).
    if (source) {
        query += ' AND source = ?';
        params.push(source);
    } else {
        // Default for Library View: Should not show chat files
        query += " AND (source IS NULL OR source = 'library')";
    }

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


// Helper for PDF text extraction
async function extractTextFromPDF(filePath: string): Promise<string | null> {
    try {
        console.log(`Parsing PDF: ${filePath}`);
        const dataBuffer = fs.readFileSync(filePath);

        // Path to standard fonts for PDF.js - MUST use forward slashes and end with trailing slash
        let standardFontsPath = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'standard_fonts', '/');
        standardFontsPath = standardFontsPath.replace(/\\/g, '/');
        if (!standardFontsPath.endsWith('/')) standardFontsPath += '/';

        let textContent = null;
        // Handle different pdf-parse versions (Function vs Class)
        if (pdfParse.prototype && pdfParse.prototype.getText) {
            // Class-based
            console.log("Using PDFParse Class");
            const uint8Array = new Uint8Array(dataBuffer);
            const parser = new pdfParse({
                data: uint8Array,
                standardFontDataUrl: standardFontsPath
            });
            const result = await parser.getText();
            textContent = result.text;
        } else {
            // Function-based - standard pdf-parse
            console.log("Using PDFParse Function");
            const data = await pdfParse(dataBuffer);
            textContent = data.text;
        }

        // Fallback strategy if extraction was unsuccessful or unreadable
        if (!textContent || textContent.trim().length < 10) {
            console.warn("PDF extraction suspicious or empty, trying fallback...");
            if (typeof pdfParseLib === 'function') {
                console.log("Fallback: Using pdfParseLib function");
                const data = await pdfParseLib(dataBuffer);
                textContent = data.text;
            }
        }

        return textContent;
    } catch (e) {
        console.error('PDF Parse Error:', e);
        return null;
    }
}


app.post('/api/resources', upload.single('file'), async (req, res) => {
    console.log('Received upload request');
    console.log('Body:', req.body);
    console.log('File:', req.file);

    const db = getDb();
    const { title, type, department, trimester, year, faculty, subject, userId, source } = req.body;
    const file = req.file;

    if (!file) {
        console.error('No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Relative path for frontend access
    const relativePath = '/uploads/' + path.relative(uploadsDir, file.path).replace(/\\/g, '/');
    const id = uuidv4();
    const resourceSource = source || 'library'; // Default to library

    let textContent = null;
    if (file.mimetype === 'application/pdf') {
        textContent = await extractTextFromPDF(file.path);
        if (textContent && textContent.trim()) {
            console.log(`Extracted ${textContent.length} characters from PDF.`);
        } else {
            console.warn("PDF extraction failed.");
        }
    } else {
        console.log(`Skipping text extraction for mimetype: ${file.mimetype}`);
    }

    try {
        await db.run(
            `INSERT INTO resources (id, user_id, title, type, department, trimester, year, faculty, subject, file_path, text_content, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [id, userId || 'u_me', title, type, department, trimester, year, faculty, subject, relativePath, textContent, resourceSource]
        );
        console.log('Resource saved to DB:', id, 'Source:', resourceSource);
        res.json({ success: true, id, file_path: relativePath });
    } catch (e) {
        console.error('DB Error during resource upload:', e);
        res.status(500).json({ error: (e as Error).message });
    }
});

app.post('/api/resources/:id/analyze', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { mode } = req.body; // 'explain' or 'practice'

    try {
        const resource = await db.get('SELECT * FROM resources WHERE id = ?', id);
        if (!resource) return res.status(404).json({ error: 'Resource not found' });

        let content = resource.text_content;

        // If no text content and it's a PDF, try on-the-fly extraction
        if (!content && resource.file_path && resource.file_path.toLowerCase().endsWith('.pdf')) {
            console.log("Attempting on-the-fly text extraction for existing PDF...");
            const fullPath = path.join(__dirname, '..', resource.file_path);
            if (fs.existsSync(fullPath)) {
                content = await extractTextFromPDF(fullPath);
                if (content) {
                    // Update the DB so we don't have to parse it again
                    await db.run('UPDATE resources SET text_content = ? WHERE id = ?', [content, id]);
                }
            }
        }

        if (!content) {
            return res.status(400).json({ error: 'This resource has no readable text. Make sure it is a PDF with selectable text or a valid note.' });
        }

        let prompt = "";
        if (mode === 'explain') {
            prompt = `
                You are LearnSphere AI, an elite academic tutor. 
                
                USER OBJECTIVE: I want to understand this material perfectly. Explain it to me using "huge terms" made simple, using easy words and clear steps.
                
                YOUR TASK:
                1. Provide a "Big Picture" summary of what this document is about.
                2. Identify and explain 3-5 key concepts from the text.
                3. Break down ANY complex jargon or technical terms into simple, every-day language.
                4. Use a friendly, encouraging tone.
                
                FORMATTING RULES:
                - Use clear Markdown headers (##) for sections.
                - Use **bold** for important definitions.
                - Use bullet points for readability.
                - If there are equations or formulas, explain them in plain English.
                
                CONTENT TO EXPLAIN:
                ---
                ${content.slice(0, 35000)}
                ---
            `;
        } else if (mode === 'practice') {
            prompt = `
                You are LearnSphere AI, a professional academic examiner. 
                
                USER OBJECTIVE: I want to practice and test my knowledge on this specific material.
                
                YOUR TASK:
                1. Create a "Study Prep" set based ONLY on the provided content.
                2. Include 3 Multiple Choice Questions (MCQs) with 4 options each (mark them A, B, C, D).
                3. After EACH question, immediately provide the correct answer starting with "Answer:" and a brief explanation.
                4. Include 2 Short Answer Questions that require critical thinking about the text, followed immediately by a "Suggested Answer:" section.
                
                FORMATTING RULES:
                - Use clear Markdown headers.
                - Keep the questions challenging but fair.
                - Important: Place the answer and explanation immediately after EACH question, NOT at the end.
                
                CONTENT FOR QUESTIONS:
                ---
                ${content.slice(0, 35000)}
                ---
            `;
        } else {
            return res.status(400).json({ error: 'Invalid analysis mode' });
        }

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        const text = response.text || "No response generated";
        res.json({ text });
    } catch (e) {
        console.error('AI Analysis Error:', e);
        res.status(500).json({ error: (e as Error).message });
    }
});

// AI TUTOR API

// Get Chat History
// Get All Chat Threads for User
app.get('/api/chats', async (req, res) => {
    const db = getDb();
    const { userId } = req.query;
    try {
        const chats = await db.all('SELECT * FROM chats WHERE user_id = ? ORDER BY updated_at DESC', [userId || 'u_me']);
        res.json(chats);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// Get Messages for specific Chat
app.get('/api/chats/:id/messages', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    try {
        const messages = await db.all('SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC', id);
        res.json(messages.map(m => ({ role: m.role, text: m.content })));
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// Delete Chat
app.delete('/api/chats/:id', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    try {
        await db.run('DELETE FROM chat_messages WHERE chat_id = ?', id);
        await db.run('DELETE FROM chats WHERE id = ?', id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// Send Message (Supports chatId)
app.post('/api/chat', async (req, res) => {
    console.log("POST /api/chat received:", req.body);
    const db = getDb();
    const { message, userId, mode, chatId } = req.body;
    const uId = userId || 'u_me';

    if (!process.env.VITE_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Server Configuration Error: Missing API Key" });
    }

    try {
        let chat;
        let cId = chatId;

        // 1. Get or Create Chat Session
        if (cId) {
            chat = await db.get('SELECT * FROM chats WHERE id = ?', [cId]);
        }

        if (!chat) {
            cId = uuidv4();
            // Generate a title based on the first few words of the message
            const title = message.split(' ').slice(0, 5).join(' ') + '...';
            await db.run('INSERT INTO chats (id, user_id, title) VALUES (?, ?, ?)', [cId, uId, title]);
            chat = { id: cId };
        } else {
            // Update timestamp
            await db.run('UPDATE chats SET updated_at = datetime(\'now\') WHERE id = ?', [cId]);
        }

        // 2. Save User Message
        const userMsgId = uuidv4();
        await db.run('INSERT INTO chat_messages (id, chat_id, role, content) VALUES (?, ?, ?, ?)', [userMsgId, cId, 'user', message]);

        // 3. Build Context (History + Resources)
        const historyRows = await db.all('SELECT role, content FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC', cId);
        const history = historyRows.map(r => ({
            role: r.role === 'user' ? 'user' : 'model',
            parts: [{ text: r.content }]
        }));

        let systemInstruction = "You are LearnSphere AI Tutor. Be encouraging, explain complex concepts step-by-step. Use Markdown.";

        if (mode === 'resource') {
            // RAG: Fetch user resources
            const resources = await db.all('SELECT title, text_content FROM resources WHERE user_id = ? AND text_content IS NOT NULL', [uId]);
            const contextText = resources.map(r => `Document: ${r.title}\nContent: ${r.text_content}`).join('\n\n');

            if (contextText) {
                const safeContext = contextText.slice(0, 100000);
                systemInstruction += `\n\nIMPORTANT: You have access to the following student's academic resources. Answer the user's question STRICTLY based on these resources if possible. If the answer is not in the resources, state that you couldn't find it in the uploaded documents.\n\n---CONTEXT---\n${safeContext}\n---END CONTEXT---`;
            } else {
                systemInstruction += "\n\nThe user wanted to ask about resources, but no readable resources (PDFs with text) were found.";
            }
        }

        // 4. Generate Response
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: history,
            config: { systemInstruction: systemInstruction }
        });

        const responseText = response.text || "No response generated";

        // 5. Save Model Response
        const botMsgId = uuidv4();
        await db.run('INSERT INTO chat_messages (id, chat_id, role, content) VALUES (?, ?, ?, ?)', [botMsgId, cId, 'model', responseText]);

        res.json({ role: 'model', text: responseText, chatId: cId });

    } catch (e) {
        console.error("AI Error:", e);
        res.status(500).json({ error: (e as Error).message });
    }
});

// PROJECTS API
app.get('/api/projects', async (req, res) => {
    const db = getDb();
    try {
        const projects = await db.all(`
            SELECT p.*, u.name as current_owner_name 
            FROM projects p 
            LEFT JOIN users u ON p.owner_id = u.id 
            ORDER BY p.created_at DESC
        `);

        // Enrich projects with member count and progress
        const enrichedProjects = await Promise.all(projects.map(async (p) => {
            const members = await db.all('SELECT * FROM project_members WHERE project_id = ?', p.id);
            const tasks = await db.all('SELECT * FROM project_tasks WHERE project_id = ?', p.id);

            const totalTasks = tasks.length;
            const doneTasks = tasks.filter(t => t.status === 'Done').length;
            const percentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

            return {
                ...p,
                ownerName: p.current_owner_name || p.owner_name, // Use current user name or fallback to snapshot
                tags: p.tags ? JSON.parse(p.tags) : [],
                lookingFor: p.looking_for ? JSON.parse(p.looking_for) : [],
                memberCount: members.length,
                percentage
            };
        }));

        const stats = {
            totalProjects: projects.length,
            completedProjects: projects.filter(p => p.status === 'Completed').length,
            totalParticipants: enrichedProjects.reduce((acc, p) => acc + (p.memberCount || 0), 0)
        };

        res.json({ projects: enrichedProjects, stats });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.post('/api/projects', async (req, res) => {
    const db = getDb();
    const { ownerId, ownerName, ownerAvatar, title, description, trimester, year, tags, lookingFor, membersNeeded } = req.body;
    const id = uuidv4();
    try {
        await db.run(
            `INSERT INTO projects (id, owner_id, owner_name, owner_avatar, title, description, trimester, year, tags, looking_for, members_needed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, ownerId, ownerName, ownerAvatar, title, description, trimester, year, JSON.stringify(tags || []), JSON.stringify(lookingFor || []), membersNeeded || 1]
        );

        // Add owner as Lead member automatically
        await db.run(
            'INSERT INTO project_members (project_id, user_id, user_name, user_avatar, student_id, role) VALUES (?, ?, ?, ?, ?, ?)',
            [id, ownerId, ownerName, ownerAvatar, req.body.ownerStudentId || '', 'Leader']
        );

        console.log('Project created successfully:', id);
        res.json({ success: true, id });
    } catch (e) {
        console.error('Error creating project:', e);
        res.status(500).json({ error: (e as Error).message });
    }
});

app.get('/api/projects/:id', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    try {
        const project = await db.get(`
            SELECT p.*, u.name as current_owner_name 
            FROM projects p 
            LEFT JOIN users u ON p.owner_id = u.id 
            WHERE p.id = ?
        `, id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const members = await db.all(`
            SELECT pm.*, u.name as current_name, u.avatar as current_avatar 
            FROM project_members pm 
            LEFT JOIN users u ON pm.user_id = u.id 
            WHERE pm.project_id = ?
        `, id);
        const tasks = await db.all('SELECT * FROM project_tasks WHERE project_id = ? ORDER BY created_at ASC', id);
        const updates = await db.all('SELECT * FROM project_updates WHERE project_id = ? ORDER BY created_at DESC', id);

        // Calculate progress
        const totalTasks = tasks.length;
        const doneTasks = tasks.filter(t => t.status === 'Done').length;
        const percentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

        // Map members to camelCase and use latest user data
        const mappedMembers = members.map(m => ({
            userId: m.user_id,
            userName: m.current_name || m.user_name,
            userAvatar: m.current_avatar || m.user_avatar,
            student_id: m.student_id,
            role: m.role === 'Lead' ? 'Leader' : m.role
        }));

        const mappedTasks = tasks.map(t => ({
            ...t,
            assignees: t.assignees ? JSON.parse(t.assignees) : (t.assigned_to ? [{ id: t.assigned_to, name: t.assigned_name, avatar: t.assigned_avatar }] : [])
        }));

        res.json({
            ...project,
            ownerName: project.current_owner_name || project.owner_name,
            tags: project.tags ? JSON.parse(project.tags) : [],
            lookingFor: project.looking_for ? JSON.parse(project.looking_for) : [],
            members: mappedMembers,
            tasks: mappedTasks,
            updates,
            percentage
        });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.put('/api/projects/:id', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { status, title, description, membersNeeded, trimester, year, tags, lookingFor } = req.body;
    try {
        if (status) await db.run('UPDATE projects SET status = ? WHERE id = ?', [status, id]);
        if (title) await db.run('UPDATE projects SET title = ? WHERE id = ?', [title, id]);
        if (description) await db.run('UPDATE projects SET description = ? WHERE id = ?', [description, id]);
        if (membersNeeded !== undefined) await db.run('UPDATE projects SET members_needed = ? WHERE id = ?', [membersNeeded, id]);
        if (trimester) await db.run('UPDATE projects SET trimester = ? WHERE id = ?', [trimester, id]);
        if (year) await db.run('UPDATE projects SET year = ? WHERE id = ?', [year, id]);
        if (tags) await db.run('UPDATE projects SET tags = ? WHERE id = ?', [JSON.stringify(tags), id]);
        if (lookingFor) await db.run('UPDATE projects SET looking_for = ? WHERE id = ?', [JSON.stringify(lookingFor), id]);

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    try {
        await db.run('DELETE FROM projects WHERE id = ?', id);
        await db.run('DELETE FROM project_members WHERE project_id = ?', id);
        await db.run('DELETE FROM project_tasks WHERE project_id = ?', id);
        await db.run('DELETE FROM project_updates WHERE project_id = ?', id);
        await db.run('DELETE FROM project_applications WHERE project_id = ?', id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// MEMBERS
app.post('/api/projects/:id/members', async (req, res) => {
    const db = getDb();
    const { id: projectId } = req.params;
    const { userId, userName, userAvatar, role } = req.body;
    try {
        await db.run(
            `INSERT INTO project_members (project_id, user_id, user_name, user_avatar, role) VALUES (?, ?, ?, ?, ?)`,
            [projectId, userId, userName, userAvatar, role || 'Contributor']
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.delete('/api/projects/:id/members/:userId', async (req, res) => {
    const db = getDb();
    const { id, userId } = req.params;
    try {
        await db.run('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [id, userId]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// APPLICATIONS
app.get('/api/projects/:id/applications', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    try {
        const applications = await db.all('SELECT * FROM project_applications WHERE project_id = ? ORDER BY created_at DESC', id);
        res.json(applications);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.post('/api/projects/:id/applications', async (req, res) => {
    const db = getDb();
    const { id: projectId } = req.params;
    const { userId, userName, userAvatar, studentId, phoneNumber, description } = req.body;
    const id = uuidv4();
    try {
        await db.run(
            `INSERT INTO project_applications (id, project_id, user_id, user_name, user_avatar, student_id, phone_number, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, projectId, userId, userName, userAvatar, studentId, phoneNumber, description]
        );
        res.json({ success: true, id });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.put('/api/projects/:id/applications/:appId', async (req, res) => {
    const db = getDb();
    const { id: projectId, appId } = req.params;
    const { status } = req.body; // Accepted or Rejected
    try {
        await db.run('UPDATE project_applications SET status = ? WHERE id = ?', [status, appId]);

        if (status === 'Accepted') {
            const app = await db.get('SELECT * FROM project_applications WHERE id = ?', appId);
            const project = await db.get('SELECT title, owner_name, owner_avatar, owner_id FROM projects WHERE id = ?', projectId);

            await db.run(
                'INSERT OR IGNORE INTO project_members (project_id, user_id, user_name, user_avatar, student_id, role) VALUES (?, ?, ?, ?, ?, ?)',
                [projectId, app.user_id, app.user_name, app.user_avatar, app.student_id, 'Contributor']
            );

            // Create notification for applicant
            await createNotification({
                userId: app.user_id,
                type: 'project_accepted',
                title: 'Application Accepted!',
                message: `Your application for "${project.title}" has been accepted`,
                projectId: projectId,
                actorId: project.owner_id,
                actorName: project.owner_name,
                actorAvatar: project.owner_avatar
            });
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// TASKS
app.post('/api/projects/:id/tasks', async (req, res) => {
    const db = getDb();
    const { id: projectId } = req.params;
    const { title, description, assignedTo, assignedName, assignedAvatar, dueDate, assignees } = req.body;
    const id = uuidv4();
    try {
        await db.run(
            `INSERT INTO project_tasks (id, project_id, title, description, assigned_to, assigned_name, assigned_avatar, due_date, assignees) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                projectId,
                title,
                description,
                assignedTo || null,
                assignedName || null,
                assignedAvatar || null,
                dueDate || null,
                assignees ? JSON.stringify(assignees) : null
            ]
        );
        res.json({ success: true, id });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.put('/api/projects/:projectId/tasks/:taskId', async (req, res) => {
    const db = getDb();
    const { taskId } = req.params;
    const { status, title, description, assignees, dueDate } = req.body;
    try {
        const sets = [];
        const params = [];

        if (status !== undefined) { sets.push('status = ?'); params.push(status); }
        if (title !== undefined) { sets.push('title = ?'); params.push(title); }
        if (description !== undefined) { sets.push('description = ?'); params.push(description); }
        if (assignees !== undefined) { sets.push('assignees = ?'); params.push(JSON.stringify(assignees)); }
        if (dueDate !== undefined) { sets.push('due_date = ?'); params.push(dueDate); }

        if (sets.length === 0) return res.json({ success: true, message: 'No changes' });

        params.push(taskId);
        await db.run(`UPDATE project_tasks SET ${sets.join(', ')} WHERE id = ?`, params);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.delete('/api/projects/:projectId/tasks/:taskId', async (req, res) => {
    const db = getDb();
    const { taskId } = req.params;
    try {
        await db.run('DELETE FROM project_tasks WHERE id = ?', taskId);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// ADMIN API
app.get('/api/admin/stats', async (req, res) => {
    const db = getDb();
    try {
        const userCount = await db.get('SELECT count(*) as count FROM users');
        const postCount = await db.get('SELECT count(*) as count FROM posts');
        const projectCount = await db.get('SELECT count(*) as count FROM projects');
        const resourceCount = await db.get('SELECT count(*) as count FROM resources');

        const recentUsers = await db.all('SELECT id, name, email, avatar, role FROM users ORDER BY id DESC LIMIT 5');
        const recentPosts = await db.all('SELECT p.*, u.name as author_name FROM posts p LEFT JOIN users u ON p.user_id = u.id ORDER BY created_at DESC LIMIT 5');
        const recentProjects = await db.all('SELECT * FROM projects ORDER BY created_at DESC LIMIT 5');

        const isGeminiActive = !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);

        res.json({
            users: userCount.count,
            posts: postCount.count,
            projects: projectCount.count,
            resources: resourceCount.count,
            recent: {
                users: recentUsers,
                posts: recentPosts,
                projects: recentProjects
            },
            system: {
                uptime: process.uptime(),
                gemini: isGeminiActive ? 'Active' : 'Inactive',
                nodeVersion: process.version,
                platform: process.platform
            }
        });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.get('/api/admin/users', async (req, res) => {
    const db = getDb();
    try {
        const users = await db.all(`
            SELECT u.*, 
            (SELECT count(*) FROM posts WHERE user_id = u.id) as post_count,
            (SELECT count(*) FROM projects WHERE owner_id = u.id) as project_count
            FROM users u
        `);
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.put('/api/admin/users/:id', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { name, email, role, major, avatar } = req.body;
    console.log(`Updating user ${id}:`, { name, email, role, major });
    try {
        await db.run(
            'UPDATE users SET name = ?, email = ?, role = ?, major = ?, avatar = ? WHERE id = ?',
            [name, email, role, major, avatar, id]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Update user error:', e);
        res.status(500).json({ error: (e as Error).message });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    try {
        await db.run('DELETE FROM users WHERE id = ?', id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.get('/api/admin/posts', async (req, res) => {
    const db = getDb();
    try {
        const posts = await db.all(`
            SELECT p.*, 
            COALESCE(u.name, p.author_name) as author_name, 
            COALESCE(u.avatar, p.author_avatar) as author_avatar,
            u.email as author_email
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `);
        res.json(posts);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.delete('/api/admin/posts/:id', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    try {
        await db.run('DELETE FROM posts WHERE id = ?', id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.get('/api/admin/resources', async (req, res) => {
    const db = getDb();
    try {
        const resources = await db.all('SELECT * FROM resources ORDER BY created_at DESC');
        res.json(resources);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.delete('/api/admin/resources/:id', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    try {
        await db.run('DELETE FROM resources WHERE id = ?', id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.get('/api/admin/projects', async (req, res) => {
    const db = getDb();
    try {
        const projects = await db.all('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(projects);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.delete('/api/admin/projects/:id', async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    try {
        // Also delete members, tasks, and updates to be clean
        await db.run('DELETE FROM projects WHERE id = ?', id);
        await db.run('DELETE FROM project_members WHERE project_id = ?', id);
        await db.run('DELETE FROM project_tasks WHERE project_id = ?', id);
        await db.run('DELETE FROM project_updates WHERE project_id = ?', id);
        await db.run('DELETE FROM project_applications WHERE project_id = ?', id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// NOTIFICATIONS API
app.get('/api/notifications', async (req, res) => {
    const db = getDb();
    const { userId } = req.query;

    if (!userId) return res.status(400).json({ error: 'User ID required' });

    try {
        const notifications = await db.all(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            userId
        );
        res.json(notifications);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.post('/api/notifications/mark-read', async (req, res) => {
    const db = getDb();
    const { notificationId } = req.body;

    try {
        await db.run('UPDATE notifications SET read = 1 WHERE id = ?', notificationId);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.post('/api/notifications/mark-all-read', async (req, res) => {
    const db = getDb();
    const { userId } = req.body;

    try {
        await db.run('UPDATE notifications SET read = 1 WHERE user_id = ?', userId);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.delete('/api/notifications/:id', async (req, res) => {
    const db = getDb();
    const { id } = req.params;

    try {
        await db.run('DELETE FROM notifications WHERE id = ?', id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// Helper function to create notifications
async function createNotification(params: {
    userId: string;
    type: 'like' | 'comment' | 'project_accepted';
    title: string;
    message: string;
    postId?: string;
    projectId?: string;
    actorId: string;
    actorName: string;
    actorAvatar: string;
}) {
    const db = getDb();
    const id = uuidv4();

    try {
        await db.run(
            `INSERT INTO notifications (id, user_id, type, title, message, post_id, project_id, actor_id, actor_name, actor_avatar) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                params.userId,
                params.type,
                params.title,
                params.message,
                params.postId || null,
                params.projectId || null,
                params.actorId,
                params.actorName,
                params.actorAvatar
            ]
        );
    } catch (e) {
        console.error('Error creating notification:', e);
    }
}

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
