# AWS S3 File Manager

A modern, responsive web application for managing files in AWS S3 buckets. Built with React, Express, and the AWS SDK, this application provides a user-friendly interface for uploading, viewing, and deleting files stored in Amazon S3.

## ✨ Features

- **Secure AWS Connection**: Connect to your S3 bucket using AWS credentials
- **File Upload**: Upload files directly to your S3 bucket with progress feedback
- **File Management**: View, download, and delete uploaded files
- **Responsive Design**: Modern UI that works seamlessly across devices
- **Session Management**: Secure session-based authentication
- **Real-time Feedback**: Loading states and success/error messages

## 🚀 Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Axios** - HTTP client for API requests
- **Modern CSS** - Custom styling with gradients and animations

### Backend
- **Node.js & Express** - Server framework
- **AWS SDK v3** - Official AWS JavaScript SDK
- **Express Session** - Session management
- **CORS** - Cross-origin resource sharing

### Cloud & Deployment
- **Vercel** - Deployment platform
- **AWS S3** - File storage service

## 📋 Prerequisites

Before running this application, make sure you have:

1. **Node.js** (version 14 or higher)
2. **npm** or **yarn** package manager
3. **AWS Account** with S3 access
4. **AWS IAM User** with the following permissions:
   - `s3:GetObject`
   - `s3:PutObject`
   - `s3:DeleteObject`
   - `s3:ListBucket`
   - `s3:HeadBucket`

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mys3webapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   FRONTEND_URL=http://localhost:5173
   ```
   
   For development, the frontend environment is configured in `src/.env.development`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

## 🚦 Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   node api/server.js
   ```
   The server will run on `http://localhost:8000`

2. **Start the frontend development server**
   ```bash
   npm run dev
   ```
   The React app will run on `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
mys3webapp/
├── api/
│   └── server.js          # Express backend server
├── src/
│   ├── App.jsx           # Main React component
│   ├── App.css           # Application styles
│   ├── main.jsx          # React entry point
│   └── .env.development  # Development environment variables
├── package.json          # Dependencies and scripts
├── vercel.json          # Vercel deployment configuration
├── vite.config.js       # Vite configuration
└── README.md            # Project documentation
```

## 🔧 Configuration

### AWS Setup

1. **Create an IAM User**
   - Go to AWS IAM Console
   - Create a new user with programmatic access
   - Attach the following policy (replace `YOUR_BUCKET_NAME`):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket",
           "s3:HeadBucket"
         ],
         "Resource": [
           "arn:aws:s3:::YOUR_BUCKET_NAME",
           "arn:aws:s3:::YOUR_BUCKET_NAME/*"
         ]
       }
     ]
   }
   ```

2. **Create an S3 Bucket**
   - Go to AWS S3 Console
   - Create a new bucket
   - Configure CORS if needed for web access

### Application Configuration

When you run the application, you'll need to provide:
- **Bucket Name**: Your S3 bucket name
- **AWS Region**: The region where your bucket is located (e.g., `us-east-1`)
- **Access Key ID**: Your IAM user's access key
- **Secret Access Key**: Your IAM user's secret key

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/connect` | Connect to AWS S3 with credentials |
| POST | `/api/logout` | Disconnect and clear session |
| GET | `/api/generate-upload-url` | Get presigned URL for file upload |
| GET | `/api/list-files` | List all uploaded files |
| DELETE | `/api/delete-file/:fileKey` | Delete a specific file |

## 🔒 Security Features

- **Session-based Authentication**: Credentials are stored securely in server sessions
- **Presigned URLs**: Files are uploaded directly to S3 using temporary URLs
- **CORS Protection**: Configured for specific frontend domains
- **Input Validation**: Server-side validation of all inputs
- **Error Handling**: Comprehensive error handling and user feedback

## 🚀 Deployment

### Vercel Deployment

This project is configured for easy deployment on Vercel:

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard:
   - `FRONTEND_URL`: Your deployed frontend URL
3. **Deploy** - Vercel will automatically build and deploy your application

The `vercel.json` configuration handles:
- API routing to the Express server
- Static file serving for the React app
- Proper redirects for SPA routing

## 🎨 UI/UX Features

- **Modern Design**: Clean, minimalist interface with subtle animations
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Themed**: Elegant color scheme with gradient accents
- **Loading States**: Visual feedback during file operations
- **Error Handling**: User-friendly error messages
- **File Information**: Display file sizes and easy management options

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information about your problem
3. Include error messages, browser information, and steps to reproduce

## 🔮 Future Enhancements

- [ ] Drag and drop file upload
- [ ] Bulk file operations
- [ ] File preview functionality
- [ ] Advanced file filtering and search
- [ ] User management and permissions
- [ ] File sharing capabilities
- [ ] Integration with other AWS services

---

**Built with ❤️ using React, Express, and AWS SDK**