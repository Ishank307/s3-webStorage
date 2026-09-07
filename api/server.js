import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';
const COOKIE_NAME = 's3_session';

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

app.use(cors({
    origin: process.env.FRONTEND_URL || true, // Allow requesting origin in dev
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());


// Decode the JWT cookie and return an S3 client + bucketName, or null
const getSessionFromCookie = (req) => {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return null;

    try {
        return jwt.verify(token, JWT_SECRET); // { accessKeyId, secretAccessKey, region, bucketName }
    } catch {
        return null;
    }
};


// Check if a valid session cookie exists (used on frontend mount)
app.get('/api/status', (req, res) => {
    const session = getSessionFromCookie(req);
    res.json({ connected: !!session });
});


// Validate credentials, then issue a signed JWT as an httpOnly cookie
app.post('/api/connect', async (req, res) => {
    const { accessKeyId, secretAccessKey, region, bucketName } = req.body;

    if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const tempS3Client = new S3Client({
            region,
            credentials: { accessKeyId, secretAccessKey },
        });

        await tempS3Client.send(new HeadBucketCommand({ Bucket: bucketName }));

        // Credentials valid — pack them into a signed JWT cookie
        const token = jwt.sign({ accessKeyId, secretAccessKey, region, bucketName }, JWT_SECRET, {
            expiresIn: '30d',
        });

        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: isProduction, // secure true only on HTTPS (prod)
            sameSite: isProduction ? 'None' : 'Lax', // Lax for http://localhost cross-port or proxy
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.status(200).json({ message: 'Connected successfully!' });
    } catch (err) {
        console.error('Connection failed', err);
        res.status(401).json({ message: 'Connection failed. Invalid credentials or bucket name.' });
    }
});


// Clear the session cookie
app.post('/api/logout', (req, res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'None' : 'Lax',
    });
    res.status(200).json({ message: 'Logged out successfully.' });
});


app.get('/api/generate-upload-url', async (req, res) => {
    const session = getSessionFromCookie(req);
    if (!session) return res.status(403).json({ error: 'Not connected to AWS.' });

    const { accessKeyId, secretAccessKey, region, bucketName } = session;
    const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    const { fileName, contentType } = req.query;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: `uploads/user-uploads/${fileName}`,
        ContentType: contentType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.json({ uploadUrl: url });
});


app.delete('/api/delete-file/:fileKey', async (req, res) => {
    const session = getSessionFromCookie(req);
    if (!session) return res.status(403).json({ error: 'Not connected to AWS.' });

    const { accessKeyId, secretAccessKey, region, bucketName } = session;
    const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    const { fileKey } = req.params;

    try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileKey }));
        res.json({ message: 'File deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete file.' });
    }
});


app.get('/api/list-files', async (req, res) => {
    const session = getSessionFromCookie(req);
    if (!session) return res.status(403).json({ error: 'Not connected to AWS.' });

    const { accessKeyId, secretAccessKey, region, bucketName } = session;
    const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });

    const { Contents = [] } = await s3.send(new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'uploads/user-uploads/',
    }));

    const filesWithUrls = await Promise.all(
        Contents.map(async (file) => {
            const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucketName, Key: file.Key }), { expiresIn: 3600 });
            return { key: file.Key, url, size: file.Size };
        })
    );

    res.json(filesWithUrls.filter(f => f.size > 0));
});

if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
        console.log(`✅ Backend server running at http://localhost:${PORT}`);
    });
}

export default app;