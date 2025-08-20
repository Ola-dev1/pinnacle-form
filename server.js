// server.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import FormData from "form-data"; // 👈 add this

dotenv.config();

const app = express();
app.use(
    cors({
        origin: ["http://localhost:3000", "http://localhost:5173"],
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
    })
);
app.use(express.json({ limit: "10mb" })); // allow big base64 payloads

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const TELEGRAM_TEXT_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
const TELEGRAM_PHOTO_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;

app.post("/send-telegram", async (req, res) => {
    try {
        const { message, signature } = req.body;

        // 1️⃣ Send the text message first
        const msgResponse = await fetch(TELEGRAM_TEXT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
            }),
        });
        const msgData = await msgResponse.json();

        if (!msgResponse.ok || !msgData.ok) {
            throw new Error(`Telegram text error: ${msgData.description || "Unknown"}`);
        }

        // 2️⃣ Send the signature as a photo (if exists)
        if (signature) {
            // Strip "data:image/png;base64," prefix
            const base64Data = signature.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");

            // Prepare multipart form-data
            const form = new FormData();
            form.append("chat_id", CHAT_ID);
            form.append("caption", "🖊 Applicant Signature");
            form.append("photo", buffer, { filename: "signature.png", contentType: "image/png" });

            const photoResponse = await fetch(TELEGRAM_PHOTO_URL, {
                method: "POST",
                body: form,
            });
            const photoData = await photoResponse.json();

            if (!photoResponse.ok || !photoData.ok) {
                throw new Error(`Telegram photo error: ${photoData.description || "Unknown"}`);
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error("❌ Backend error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
    console.log(`✅ Server running on http://localhost:${PORT}`)
);
