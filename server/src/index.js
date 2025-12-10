import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS configuration - allow multiple origins for development
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uri = process.env.MONGODB_URI || "mongodb+srv://kunalkushwah7104:kunalkushwah7104@cluster0.tbo6rzc.mongodb.net/flipr_app?retryWrites=true&w=majority";

// Track DB connection state and provide an in-memory fallback for development
let isDbConnected = false;
const fallbackStores = {
  projects: [],
  clients: [],
  contacts: [],
  subscribers: [],
};

const seedFallback = () => {
  if (fallbackStores.projects.length === 0) {
    fallbackStores.projects = [
      {
        _id: "fallback-1",
        name: "Consultation",
        description: "Personalized guidance to prepare listings for market success.",
        image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
        createdAt: new Date().toISOString(),
      },
      {
        _id: "fallback-2",
        name: "Design",
        description: "Interior refresh focused on light, flow, and clean staging.",
        image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
        createdAt: new Date().toISOString(),
      },
    ];
  }
  if (fallbackStores.clients.length === 0) {
    fallbackStores.clients = [
      {
        _id: "fallback-c1",
        name: "Rowhan Smith",
        designation: "Founder",
        description: "Process felt simple from consult to closing.",
        image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
        createdAt: new Date().toISOString(),
      },
    ];
  }
  // contacts and subscribers start empty
};

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    designation: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

const contactSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
  },
  { timestamps: true }
);

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
const Client = mongoose.model("Client", clientSchema);
const Contact = mongoose.model("Contact", contactSchema);
const Subscriber = mongoose.model("Subscriber", subscriberSchema);

app.get("/api/health", (_, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    mongodb: isDbConnected ? "connected" : "disconnected",
    mode: isDbConnected ? "full" : "degraded"
  });
});

app.get("/api/projects", async (_, res) => {
  try {
    if (!isDbConnected) return res.json(fallbackStores.projects);
    const data = await Project.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const { name, description, image } = req.body;
    if (!name || !description || !image) return res.status(400).json({ message: "Missing fields" });
    if (!isDbConnected) {
      const entry = { _id: `fallback-p-${Date.now()}`, name, description, image, createdAt: new Date().toISOString() };
      fallbackStores.projects.unshift(entry);
      return res.status(201).json(entry);
    }
    const entry = await Project.create({ name, description, image });
    res.status(201).json(entry);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Failed to create project" });
  }
});

// Delete a project by ID
app.delete("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing project id" });
    if (!isDbConnected) {
      const idx = fallbackStores.projects.findIndex((p) => p._id === id);
      if (idx === -1) return res.status(404).json({ message: "Project not found" });
      const deleted = fallbackStores.projects.splice(idx, 1)[0];
      return res.json({ message: "Project deleted", id: deleted._id });
    }
    const deleted = await Project.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project deleted", id: deleted._id });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Failed to delete project" });
  }
});

app.get("/api/clients", async (_, res) => {
  try {
    if (!isDbConnected) return res.json(fallbackStores.clients);
    const data = await Client.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

app.post("/api/clients", async (req, res) => {
  try {
    const { name, designation, description, image } = req.body;
    if (!name || !designation || !description || !image) return res.status(400).json({ message: "Missing fields" });
    if (!isDbConnected) {
      const entry = { _id: `fallback-c-${Date.now()}`, name, designation, description, image, createdAt: new Date().toISOString() };
      fallbackStores.clients.unshift(entry);
      return res.status(201).json(entry);
    }
    const entry = await Client.create({ name, designation, description, image });
    res.status(201).json(entry);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ message: "Failed to create client" });
  }
});

app.get("/api/contacts", async (_, res) => {
  try {
    if (!isDbConnected) {
      console.log(`Fetched ${fallbackStores.contacts.length} contacts (fallback)`);
      return res.json(fallbackStores.contacts);
    }
    const data = await Contact.find().sort({ createdAt: -1 });
    console.log(`Fetched ${data.length} contacts`);
    res.json(data);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
});

app.post("/api/contacts", async (req, res) => {
  try {
    const { fullName, email, phone, city } = req.body;
    console.log("Received contact submission:", { fullName, email, phone, city });
    
    if (!fullName || !email || !phone || !city) {
      console.log("Missing fields in contact submission");
      return res.status(400).json({ message: "Missing fields" });
    }
    if (!isDbConnected) {
      const entry = { _id: `fallback-contact-${Date.now()}`, fullName, email, phone, city, createdAt: new Date().toISOString() };
      fallbackStores.contacts.unshift(entry);
      console.log("Contact (fallback) created:", entry._id);
      return res.status(201).json(entry);
    }
    const entry = await Contact.create({ fullName, email, phone, city });
    console.log("Contact created successfully:", entry._id);
    res.status(201).json(entry);
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({ message: "Failed to create contact", error: error.message });
  }
});

app.get("/api/subscribers", async (_, res) => {
  try {
    if (!isDbConnected) return res.json(fallbackStores.subscribers);
    const data = await Subscriber.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    res.status(500).json({ message: "Failed to fetch subscribers" });
  }
});

app.post("/api/subscribers", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing fields" });
    if (!isDbConnected) {
      const existing = fallbackStores.subscribers.find((s) => s.email === email);
      if (existing) return res.status(200).json(existing);
      const entry = { _id: `fallback-s-${Date.now()}`, email, createdAt: new Date().toISOString() };
      fallbackStores.subscribers.unshift(entry);
      return res.status(201).json(entry);
    }
    const existing = await Subscriber.findOne({ email });
    if (existing) return res.status(200).json(existing);
    const entry = await Subscriber.create({ email });
    res.status(201).json(entry);
  } catch (error) {
    console.error("Error creating subscriber:", error);
    if (error.code === 11000) {
      res.status(200).json({ message: "Email already subscribed" });
    } else {
      res.status(500).json({ message: "Failed to create subscriber" });
    }
  }
});

const seedData = async () => {
  const projectCount = await Project.countDocuments();
  if (projectCount === 0) {
    await Project.insertMany([
      {
        name: "Consultation",
        description: "Personalized guidance to prepare listings for market success.",
        image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Design",
        description: "Interior refresh focused on light, flow, and clean staging.",
        image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Marketing & Design",
        description: "Campaigns pairing lifestyle photography with targeted reach.",
        image: "https://images.unsplash.com/photo-1505692069463-5e3405e2e7ee?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Consultation & Marketing",
        description: "Listing launch plans with pricing strategy and media assets.",
        image: "https://images.unsplash.com/photo-1570129476761-5c0f5be0c5d8?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Consultation",
        description: "Local market insights with renovation ROI snapshots.",
        image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",
      },
    ]);
  }
  const clientCount = await Client.countDocuments();
  if (clientCount === 0) {
    await Client.insertMany([
      {
        name: "Rowhan Smith",
        designation: "Founder",
        description: "Process felt simple from consult to closing.",
        image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
      },
      {
        name: "Shipra Kayak",
        designation: "Designer",
        description: "Design team staged our home beautifully.",
        image: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
      },
      {
        name: "John Lepore",
        designation: "Marketing Lead",
        description: "Marketing pushed traffic the first weekend.",
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80",
      },
      {
        name: "Marry Freeman",
        designation: "Homeowner",
        description: "Transparent updates and quick responses.",
        image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
      },
      {
        name: "Lucy",
        designation: "Investor",
        description: "Great insight on renovation budgets.",
        image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
      },
    ]);
  }
};

// MongoDB connection options
const mongooseOptions = {
  dbName: "flipr_app",
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose
  .connect(uri, mongooseOptions)
  .then(async () => {
    isDbConnected = true;
    console.log("✅ Connected to MongoDB");
    console.log(`📦 Database: flipr_app`);
    try {
      await seedData();
      console.log("✅ Seed data loaded");
    } catch (seedError) {
      console.warn("⚠️ Seed data error (non-critical):", seedError.message);
    }
    const port = process.env.PORT || 5000;
    app.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`📡 API health check: http://localhost:${port}/api/health`);
      console.log(`🌐 CORS enabled for: ${allowedOrigins.join(", ")}`);
    });
  })
  .catch((error) => {
    // Log the error but do not crash the server — start in degraded mode
    console.error("❌ MongoDB connection error:", error.message);
    console.error("Full error:", error);
    console.log("\n💡 Troubleshooting tips:");
    console.log("   1. Check your MongoDB connection string");
    console.log("   2. Verify your internet connection");
    console.log("   3. Check if MongoDB Atlas IP whitelist allows your IP");

    // Seed fallback data and start server so frontend health checks and static endpoints work
    seedFallback();
    const port = process.env.PORT || 5000;
    app.listen(port, "0.0.0.0", () => {
      console.log(`⚠️ Server started WITHOUT MongoDB on http://localhost:${port} (degraded mode)`);
      console.log(`📡 API health check: http://localhost:${port}/api/health`);
    });
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});

