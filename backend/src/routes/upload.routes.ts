import { Router } from 'express';
import multer from 'multer';
import { errors } from '@/middleware/errorHandler';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/kyc', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw errors.validation('No file uploaded');
    }
    // For demo/local, return a data URL; in production, integrate S3/Blob storage.
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
    res.status(200).json({
      success: true,
      data: { url: dataUrl, filename: req.file.originalname, size: req.file.size },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
