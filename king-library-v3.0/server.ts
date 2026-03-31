import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let db: any = null;

try {
  if (fs.existsSync("./firebase-applet-config.json")) {
    const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
    
    if (firebaseConfig.firestoreDatabaseId) {
      db = getFirestore(firebaseConfig.firestoreDatabaseId);
    } else {
      db = getFirestore();
    }
    console.log("Firebase Admin initialized successfully");
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development with Vite
  }));
  app.use(cors());

  // Use raw body for webhook verification
  app.use("/api/webhook/lemonsqueezy", express.raw({ type: "application/json" }));
  app.use(express.json());

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
  });
  app.use("/api/", limiter);

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "King Library v3.0 API is running" });
  });

  // Lemon Squeezy Webhook
  app.post("/api/webhook/lemonsqueezy", async (req, res) => {
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    const hmac = crypto.createHmac("sha256", secret || "");
    const digest = Buffer.from(hmac.update(req.body).digest("hex"), "utf8");
    const signature = Buffer.from(req.get("X-Signature") || "", "utf8");

    if (secret && !crypto.timingSafeEqual(digest, signature)) {
      console.error("Invalid Lemon Squeezy signature");
      return res.status(401).send("Invalid signature");
    }

    const payload = JSON.parse(req.body.toString());
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data;

    console.log(`Received Lemon Squeezy event: ${eventName}`);

    if (eventName === "order_created" && customData && customData.user_id) {
      const userId = customData.user_id;
      if (!db) return res.status(500).send("Database not initialized");

      try {
        await db.collection("users").doc(userId).update({
          isPremium: true,
          upgradedAt: FieldValue.serverTimestamp(),
          lemonSqueezyOrderId: payload.data.id
        });
        console.log(`User ${userId} upgraded to Premium via Lemon Squeezy`);
      } catch (error) {
        console.error(`Failed to upgrade user ${userId}:`, error);
        return res.status(500).send("Failed to upgrade user");
      }
    }

    res.status(200).send("Webhook received");
  });

  // Gig Routes
  app.get("/api/gigs", async (req, res) => {
    if (!db) return res.status(500).json({ message: "Database not initialized" });
    try {
      const snapshot = await db.collection("gigs").get();
      const gigs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(gigs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gigs" });
    }
  });

  app.post("/api/gigs/:id/claim", async (req, res) => {
    if (!db) return res.status(500).json({ message: "Database not initialized" });
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    try {
      const gigRef = db.collection("gigs").doc(id);
      const gig = await gigRef.get();
      
      if (!gig.exists) return res.status(404).json({ message: "Gig not found" });
      if (gig.data()?.claimedBy) return res.status(400).json({ message: "Gig already claimed" });

      await gigRef.update({
        claimedBy: userId,
        claimedAt: FieldValue.serverTimestamp(),
        status: "claimed"
      });

      res.json({ success: true, message: "Gig claimed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to claim gig" });
    }
  });

  // User Routes
  app.get("/api/user/profile/:userId", async (req, res) => {
    if (!db) return res.status(500).json({ message: "Database not initialized" });
    const { userId } = req.params;
    try {
      const userRef = db.collection("users").doc(userId);
      const user = await userRef.get();
      if (!user.exists) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user.id, ...user.data() });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
