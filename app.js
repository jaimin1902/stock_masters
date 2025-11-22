import express from "express"
import helmet from "helmet"
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { createServer } from 'http'
import { Server } from 'socket.io'
import {errorMiddleware} from "./middlewares/error.js"
import morgan from "morgan"
import dotenv from "dotenv"

// Routes
import authRoutes from './routes/authRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import productRoutes from './routes/productRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import warehouseRoutes from './routes/warehouseRoutes.js'
import receiptRoutes from './routes/receiptRoutes.js'
import deliveryOrderRoutes from './routes/deliveryOrderRoutes.js'
import transferRoutes from './routes/transferRoutes.js'
import adjustmentRoutes from './routes/adjustmentRoutes.js'
import moveHistoryRoutes from './routes/moveHistoryRoutes.js'
import supplierRoutes from './routes/supplierRoutes.js'
  
dotenv.config();
  
export const envMode = process.env.NODE_ENV?.trim() || 'DEVELOPMENT';
const port = process.env.PORT || 3000;

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Make io available globally
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Join warehouse room for real-time updates
  socket.on('join-warehouse', (warehouseId) => {
    socket.join(`warehouse-${warehouseId}`);
    console.log(`Socket ${socket.id} joined warehouse ${warehouseId}`);
  });

  // Leave warehouse room
  socket.on('leave-warehouse', (warehouseId) => {
    socket.leave(`warehouse-${warehouseId}`);
    console.log(`Socket ${socket.id} left warehouse ${warehouseId}`);
  });
});

app.use(
  helmet({
    contentSecurityPolicy: envMode !== "DEVELOPMENT",
    crossOriginEmbedderPolicy: envMode !== "DEVELOPMENT",
  })
);
    
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'))
    
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Stock Masters API',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/delivery-orders', deliveryOrderRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/move-history', moveHistoryRoutes);
app.use('/api/suppliers', supplierRoutes);

// app.get("*", (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//   });
// });
  
app.use(errorMiddleware);
    
httpServer.listen(port, () => {
  console.log('Server is working on Port:'+port+' in '+envMode+' Mode.');
  console.log('Socket.io server is running');
});
