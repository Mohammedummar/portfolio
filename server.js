require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors({ origin: "*" }));
app.use(express.json());

// ================= SERVE FRONTEND =================
app.use(express.static(path.join(__dirname, "public")));

// ================= MONGODB =================
mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;

db.on("connected", () => {
  console.log("✅ MongoDB Atlas connected");
});

db.on("error", (err) => {
  console.log("❌ MongoDB error:", err);
});

// ================= SCHEMAS =================

// ❌ Chat schema (kept but NOT saving)
const ChatSchema = new mongoose.Schema({
  userMessage: String,
  botReply: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Chat = mongoose.model("Chat", ChatSchema);

// ✅ CONTACT SCHEMA (IMPORTANT)
const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Contact = mongoose.model("Contact", ContactSchema);

// ================= GEMINI =================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ================= ROUTES =================

// 🔹 Chat API (NO DB SAVE NOW)
app.post("/chat", async (req, res) => {
  try {
    const userMessage =
      req.body.message ||
      req.body.text ||
      req.body.input;

    if (!userMessage) {
      return res.status(400).json({ reply: "No message provided" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite"
    });

    const prompt = `User: ${userMessage}`;

    const result = await model.generateContent(prompt);

    let reply =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.json({ reply: "AI failed to respond." });
    }

    // ❌ NOT SAVING TO DB
    res.json({ reply });

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ reply: "Server error" });
  }
});

// 🔹 CONTACT API (THIS SAVES DATA)
app.post("/contact", async (req, res) => {
  try {
    console.log("📩 Contact data:", req.body);

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const saved = await Contact.create({
      name,
      email,
      message
    });

    console.log("✅ Contact saved:", saved._id);

    res.json({ msg: "Message sent successfully!" });

  } catch (err) {
    console.error("❌ Contact error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// 🔹 Get Contacts (optional)
app.get("/contacts", async (req, res) => {
  try {
    const data = await Contact.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.json([]);
  }
});

// 🔹 Test Route
app.get("/test", (req, res) => {
  res.send("Backend working ✅");
});

// ================= FALLBACK =================
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================= SERVER =================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT} 🚀`);
});