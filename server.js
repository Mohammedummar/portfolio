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
mongoose.connect(process.env.MONGO_URI, {
});

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB Atlas connected");
});

mongoose.connection.on("error", (err) => {
  console.log("❌ MongoDB error:", err);
});

// ================= SCHEMAS =================

// ❌ Chat schema (NOT saving)
const ChatSchema = new mongoose.Schema({
  userMessage: String,
  botReply: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
mongoose.model("Chat", ChatSchema);

// ✅ CONTACT SCHEMA (FIXED — added subject)
const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String, // ✅ added
  message: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Contact = mongoose.model("Contact", ContactSchema);

// ================= GEMINI =================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ================= ROUTES =================

// 🔹 Chat API (NO DB SAVE)
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
      model: "gemini-2.5-flash-lite",
    });

    const result = await model.generateContent(`User: ${userMessage}`);

    const reply =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    res.json({ reply: reply || "AI failed to respond." });

  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ reply: "Server error" });
  }
});

// 🔹 CONTACT API (FULL FIX)
app.post("/contact", async (req, res) => {
  try {
    console.log("📩 Incoming contact:", req.body);

    const { name, email, subject, message } = req.body;

    // ✅ validation
    if (!name || !email || !message) {
      return res.status(400).json({
        msg: "Name, Email and Message are required",
      });
    }

    const newContact = new Contact({
      name,
      email,
      subject,
      message,
    });

    await newContact.save();

    console.log("✅ Saved to MongoDB:", newContact);

    res.status(201).json({
      msg: "Message sent successfully!",
    });

  } catch (err) {
    console.error("❌ FULL Contact error:", err.message); // 👈 important
    res.status(500).json({
      msg: err.message,
    });
  }
});

// 🔹 Get Contacts
app.get("/contacts", async (req, res) => {
  try {
    const data = await Contact.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json([]);
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
const PORT = process.env.PORT || 5000; // ✅ FIXED
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});