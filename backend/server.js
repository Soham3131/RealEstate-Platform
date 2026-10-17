const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const leadRoutes = require('./routes/leadRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const estimationRoutes = require('./routes/estimationRoutes');
const articleRoutes = require('./routes/articleRoutes');
const calculatorRoutes = require('./routes/calculatorRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const packersMoversLeadRoutes = require('./routes/packersMoversLeadRoutes');
const scheduleTourRoutes = require('./routes/scheduleTourRoutes');

const path = require('path');
const upload = require('./middleware/uploadMiddleware');

const app = express();

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'https://real-estate-platform-self.vercel.app',
    'https://real-estate-platform-henna.vercel.app',
    'https://millionaireclub.avanienterprises.in',
    'http://millionaireclub.avanienterprises.in',
];

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        return callback(null, false);
    },
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/estimation', estimationRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/calculators', calculatorRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/packers-movers', packersMoversLeadRoutes);
app.use('/api/schedule-tour', scheduleTourRoutes);

// File Upload Route
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}` });
});

app.get('/', (req, res) => {
    res.send('Real Estate Platform API is running...');
});

const PORT = process.env.PORT || 5000;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000, // Timeout after 30s instead of 5s
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Start AI scraping scheduler if enabled
        if (process.env.SCRAPING_ENABLED === 'true') {
            const { startScheduler } = require('./services/scraping/SchedulingService');
            startScheduler();
        }

        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.error(`Error: ${err.message}`);
        console.error('CRITICAL: Check your MongoDB Atlas IP Whitelist (allow 0.0.0.0/0 for testing).');
        process.exit(1);
    }
};

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[SERVER ERROR] ${new Date().toISOString()}:`, err.stack);
    res.status(500).json({ 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

connectDB();
