import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { errors } from '@/middleware/errorHandler';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

router.post('/kyc', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw errors.validation('No file uploaded');
    }
    const filename = `${Date.now()}_${req.file.originalname.replace(/\\s+/g, '_')}`;
    const filepath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filepath, req.file.buffer);
    const fileUrl = `/uploads/${filename}`;
    res.status(200).json({
      success: true,
      data: { url: fileUrl, filename: req.file.originalname, size: req.file.size },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
