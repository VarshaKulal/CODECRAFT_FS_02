// server.js (Live Server + backend)
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;
const MONGO_URI = "mongodb://127.0.0.1:27017/employeeDB";

// ---- CORS ----
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:3000"
];
app.use(cors({
  origin: function(origin, cb) {
    if (!origin) return cb(null, true); // allow Postman etc
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("CORS blocked"));
  },
  credentials: true
}));

// ---- Parsers ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Serve static frontend ----
app.use(express.static(path.join(__dirname, "public")));

// ---- MongoDB connection ----
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo error:", err));

// ---- Schemas ----
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" }
});
const User = mongoose.model("User", userSchema);

const employeeSchema = new mongoose.Schema({
  name: String,
  email: String,
  position: String,
  salary: Number,
  createdAt: { type: Date, default: Date.now }
});
const Employee = mongoose.model("Employee", employeeSchema);

// ---- Session ----
app.use(session({
  secret: "my_secret_key_replace_in_prod",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: {
    maxAge: 1000 * 60 * 60,   // 1 hour
    sameSite: "lax",          // works better across localhost
    secure: false             // keep false for local dev
  }
}));

// ---- Middleware ----
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: "Unauthorized" });
}
function requireAdmin(req, res, next) {
  if (req.session && req.session.role === "admin") return next();
  return res.status(403).json({ error: "Admin only" });
}

// ---- Seed admin ----
app.get("/seed-admin", async (req, res) => {
  try {
    if (await User.findOne({ username: "admin" })) return res.json({ message: "Admin already exists" });
    const hashed = await bcrypt.hash("admin123", 10);
    await new User({ username: "admin", password: hashed, role: "admin" }).save();
    res.json({ message: "✅ Admin created: admin / admin123" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Seed failed" });
  }
});

// ---- Auth routes ----
app.post("/api/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing fields" });
    if (await User.findOne({ username })) return res.status(400).json({ error: "Username exists" });
    const hashed = await bcrypt.hash(password, 10);
    await new User({ username, password: hashed, role: role || "user" }).save();
    res.json({ message: "✅ Registered" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.role = user.role;
    res.json({ message: "✅ Login successful", role: user.role });
  } catch (err) { console.error(err); res.status(500).json({ error: "Server error" }); }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => { res.clearCookie("connect.sid"); res.json({ message: "✅ Logged out" }); });
});

app.get("/api/me", (req, res) => {
  if (req.session && req.session.userId) return res.json({ username: req.session.username, role: req.session.role });
  return res.status(401).json({ error: "Not logged in" });
});

// ---- Employee CRUD ----

// Add employee
app.post("/api/employees", requireAuth, requireAdmin, async (req, res) => {
  try { const emp = new Employee(req.body); await emp.save(); res.json(emp); }
  catch (err) { console.error(err); res.status(500).json({ error: "Failed to add" }); }
});

// Get all employees
app.get("/api/employees", requireAuth, requireAdmin, async (req, res) => {
  try { const list = await Employee.find().sort({ createdAt: -1 }); res.json(list); }
  catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch" }); }
});

// ✅ Get single employee by ID
app.get("/api/employees/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ error: "Not found" });
    res.json(emp);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch" }); }
});

// ✅ Update employee
app.put("/api/employees/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!emp) return res.status(404).json({ error: "Not found" });
    res.json(emp);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update" }); }
});

// Delete employee
app.delete("/api/employees/:id", requireAuth, requireAdmin, async (req, res) => {
  try { await Employee.findByIdAndDelete(req.params.id); res.json({ message: "Deleted" }); }
  catch (err) { console.error(err); res.status(500).json({ error: "Failed to delete" }); }
});

// ---- Start server ----
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
