import express from "express";
import multer from "multer";
import sharp from "sharp";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10mb
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."));
    }
  },
});

async function addTextToImage(
  imageBuffer: Buffer,
  topText: string,
  bottomText: string
): Promise<Buffer> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    const fontSize = Math.floor(width / 12);
    const strokeWidth = Math.floor(fontSize / 10);

    const topTextSvg = `
      <svg width="${width}" height="${height}">
        <style>
          .title { 
            fill: white; 
            font-size: ${fontSize}px; 
            font-weight: 900; 
            font-family: Impact, Arial Black, sans-serif;
            text-transform: uppercase;
            text-anchor: middle;
            paint-order: stroke;
            stroke: black;
            stroke-width: ${strokeWidth}px;
            stroke-linejoin: round;
          }
        </style>
        <text x="50%" y="${fontSize + 20}" class="title">${escapeXml(
      topText
    )}</text>
        <text x="50%" y="${height - 20}" class="title">${escapeXml(
      bottomText
    )}</text>
      </svg>
    `;

    const result = await sharp(imageBuffer)
      .composite([
        {
          input: Buffer.from(topTextSvg),
          top: 0,
          left: 0,
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    return result;
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

app.post("/api/generate-meme", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const topText = req.body.topText || "";
    const bottomText = req.body.bottomText || "";

    if (!topText && !bottomText) {
      return res
        .status(400)
        .json({ error: "Please provide at least one text field" });
    }

    const memeBuffer = await addTextToImage(
      req.file.buffer,
      topText,
      bottomText
    );

    res.set("Content-Type", "image/jpeg");
    res.send(memeBuffer);
  } catch (error) {
    console.error("Error generating meme:", error);
    res.status(500).json({ error: "Failed to generate meme" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Meme Generator API is running" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
});
