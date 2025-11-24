require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadroutes");

const app = express();
connectDB();

// Allowed origins - add your production domains here
const allowed = [
  'http://localhost:4200',
  // Add your Render frontend URL and custom domain here
  'https://kubereshwarfrontend.onrender.com',  // Frontend URL (no hyphen)
  'http://kubereshwar-frontend.onrender.com',  // Alternative if different
  'https://kubereshwarpress.com',  // Production domain
  'https://www.kubereshwarpress.com',  // Production domain with www
  'http://kubereshwarpress.com',  // HTTP version (if needed)
  'http://www.kubereshwarpress.com',  // HTTP version with www (if needed)
];

// Allow production domains from environment variable
const prodOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

const allAllowedOrigins = [...allowed, ...prodOrigins];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return cb(null, true);
    // Check if origin is in allowed list
    if (allAllowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: false
}));

app.use(express.json());

// Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/uploads", uploadRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

