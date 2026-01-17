import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'database.sqlite');

async function registerAdmin() {
    const db = await open({
        filename: DB_FILE,
        driver: sqlite3.Database
    });

    const email = `admin_${Math.floor(Math.random() * 1000)}@learnsphere.edu`;
    const password = Math.random().toString(36).slice(-8);
    const id = uuidv4();
    const name = 'Admin User';
    const avatar = `https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff`;

    await db.run(
        `INSERT INTO users (id, email, password, name, avatar, role, level, xp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, email, password, name, avatar, 'admin', 99, 9999]
    );

    console.log('--- Admin Registered Successfully ---');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`ID:       ${id}`);
    console.log('--------------------------------------');

    await db.close();
}

registerAdmin().catch(console.error);
