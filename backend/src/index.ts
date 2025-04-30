import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { storageService } from './services/storage_service';

const app = express();
const port = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Upload endpoint
app.post('/upload', storageService.handleSingleFileUpload(), (req: Request, res: Response) => {
  const fileInfo = storageService.getFileInfo(req);

  if (!fileInfo) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  return res.status(201).json({
    message: 'File uploaded successfully',
    file: fileInfo
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 