import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'x-aws-access-key-id', 'x-aws-secret-access-key', 'x-aws-region', 'x-aws-bucket-name'],
}));

app.use(express.json());


// Build S3 client from request headers on every call
const getS3ClientFromHeaders = (req) => {
    const accessKeyId     = req.headers['x-aws-access-key-id'];
    const secretAccessKey = req.headers['x-aws-secret-access-key'];
    const region          = req.headers['x-aws-region'];

    if (!accessKeyId || !secretAccessKey || !region) return null;

    return new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
};

const getBucketName = (req) => req.headers['x-aws-bucket-name'];


// Validate credentials and bucket on connect
app.post('/api/connect', async (req, res) => {
    const { accessKeyId, secretAccessKey, region, bucketName } = req.body;

    if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
        await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
        res.status(200).json({ message: 'Connected successfully!' });
    } catch (err) {
        console.error('Connection failed', err);
        res.status(401).json({ message: 'Connection failed. Invalid credentials or bucket name.' });
    }
});


app.get('/api/generate-upload-url', async (req, res) => {
    const s3 = getS3ClientFromHeaders(req);
    if (!s3) return res.status(403).json({ error: 'Not connected to AWS.' });

    const { fileName, contentType } = req.query;
    const bucketName = getBucketName(req);

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: `uploads/user-uploads/${fileName}`,
        ContentType: contentType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.json({ uploadUrl: url });
});


app.delete('/api/delete-file/:fileKey', async (req, res) => {
    const s3 = getS3ClientFromHeaders(req);
    if (!s3) return res.status(403).json({ error: 'Not connected to AWS.' });

    const { fileKey } = req.params;
    if (!fileKey) return res.status(400).json({ error: 'File key is required.' });

    try {
        await s3.send(new DeleteObjectCommand({ Bucket: getBucketName(req), Key: fileKey }));
        res.json({ message: 'File deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete file.' });
    }
});


app.get('/api/list-files', async (req, res) => {
    const s3 = getS3ClientFromHeaders(req);
    if (!s3) return res.status(403).json({ error: 'Not connected to AWS.' });

    const bucketName = getBucketName(req);

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