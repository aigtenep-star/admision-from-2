import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 3000;

// Needed to get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Default route (serves index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Example routes for your buttons
app.get("/prospectus", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "prospectus.html"));
});

app.get("/admission-form", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admission-form.html"));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
