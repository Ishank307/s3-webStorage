import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command,DeleteObjectCommand ,HeadBucketCommand} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import session from 'express-session'

const app = express();
// const PORT = 8000
dotenv.config();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://your-frontend-domain.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}))

app.use(session({
    secret: 'something',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.json());

const getS3ClientFromSession = (req) => {
    if (!req.session.awsConfig) {
        return null;
    }

    const { region, accessKeyId, secretAccessKey } = req.session.awsConfig;
    return new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey }
    })
}

app.post('/api/connect', async (req, res) => {
    const { accessKeyId, secretAccessKey, region, bucketName } = req.body;

    if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
        return res.status(400).json({ message: 'All fields are required.' });

    }
    try {

        const tempS3CLient = new S3Client({
            region,
            credentials: { accessKeyId, secretAccessKey },
        });




        try {
            await tempS3CLient.send(new HeadBucketCommand({ Bucket: bucketName }));
            //bucket accessible
            req.session.awsConfig = { accessKeyId, secretAccessKey, region, bucketName };
            res.status(200).json({ message: 'Connected successfully!' });
        } catch (err) {
            console.error("Connection failed", err);
            return res.status(401).json({ message: 'Connection failed, invalid credentials or bucket name.' });
        }
        


    }
    catch (error) {
        console.log("Connection failed", error)
        res.status(401).json({ message: 'COnnectiion failed, check the credentials and bucket name' })
    }
});

app.post('/api/logout',(req,res)=>{

    req.session.destroy(err=>{
        if(err){
            res.status(500).json({message:"Could not logout, please try again later"})
        }
        res.clearCookie('connect.sid');

        res.status(200).json({ message: "Logged out successfully" });

        return res.json({ message: 'Logged out successfully.'});
    })
})


app.get('/api/generate-upload-url', async (req, res) => {

    const S3Client = getS3ClientFromSession(req);
    if (!S3Client) {
        return res.status(403).json({ error: "Not Connected to AWS." })
    }

    const { fileName, contentType } = req.query;
    const { bucketName } = req.session.awsConfig;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: `uploads/user-uploads/${fileName}`,
        ContentType: contentType
    });

    const url = await getSignedUrl(S3Client, command, { expiresIn: 3600 });
    res.json({ uploadUrl: url });

})


app.delete('/api/delete-file/:key(*)',async(req,res)=>{

     const S3Client = getS3ClientFromSession(req);
    if (!S3Client) {
        return res.status(403).json({ error: 'Not connected to AWS.' });
    }

    const { key } = req.params;
    if (!key) {
        return res.status(400).json({ error: 'File key is required.' });
    }


    const {bucketName}=req.session.awsConfig;


    const command = new DeleteObjectCommand({
        Bucket:bucketName,
        Key:key
    })


    try{
        await S3Client.send(command);
        res.json({message:'File deleted successfully'});
    }catch(error){
        console.log(error);
        res.status(500).json({error:'failed to delete file'})
    }


});


app.get('/api/list-files', async (req, res) => {
    const S3Client = getS3ClientFromSession(req);
    if (!S3Client) {
        return res.status(403).json({ error: "Not connected to AWS" });
    }

    const { bucketName } = req.session.awsConfig;
    const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'uploads/user-uploads/',
    });

    const { Contents = [] } = await S3Client.send(command);

    const filesWithUrls = await Promise.all(
        Contents.map(async (file) => {
            const getObjectCommand = new GetObjectCommand({ Bucket: bucketName, Key: file.Key });
            const url = await getSignedUrl(S3Client, getObjectCommand, { expiresIn: 3600 });
            return { key: file.Key, url: url, size: file.Size };
        })
    );

    res.json(filesWithUrls.filter(file => file.size > 0));
});


// app.listen(PORT, () => {
//     console.log(`✅ Backend server running at http://localhost:${PORT}`);
// });

export default app;