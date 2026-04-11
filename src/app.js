import express from 'express';
import cors from 'cors';
import multer from 'multer';
import authRoutes from './routes/authRoutes.js';
import cibilRoutes from './routes/cibilRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import dsaRoutes from './routes/DsaRoutes/dsaRoutes.js';
import adminRoutes from './routes/AdminRoutes/adminRoutes.js';
import rmRoutes from './routes/RmRoutes/rmRoutes.js';
import deptRoutes from './routes/DeptRoutes/deptRoutes.js';
import accountRoute from './routes/AccountRoutes/accountRoute.js';
import unlistedRoutes from './unlisted/routes/index.js';
import { startNewsCron } from './cron/newsCron.js';
import customerRoutes from './customer/routes/customerRoutes.js';
import productsRoutes from "./products/index.js"

startNewsCron();

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://192.168.1.83:3000',
      "http://192.168.1.69:3000",
      'https://www.infinityarthvishva.com',
      'https://infinityarthvishva.com',
    ],
    credentials: true,
  })
);
app.use(express.json());
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ Health route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Infi Dash Express Backend Running' });
});

// ✅ Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/cibil', cibilRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/contact', contactRoutes);

// ✅ Admin routes
app.use('/api/dashboard', dsaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rm', rmRoutes);
app.use('/api/department', deptRoutes);
app.use('/api/accounts', accountRoute);

// unlisted routes
app.use('/api/unlisted', unlistedRoutes);
app.use('/api/customer', customerRoutes);
app.use("/api/products", productsRoutes);

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);

  // 🔹 Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Image size must be less than 30MB',
      });
    }
  }

  // Custom validation errors
  if (err.message) {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
