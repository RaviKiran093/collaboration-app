const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { Deepgram } = require("@deepgram/sdk"); // Using Deepgram for real-time STT
const axios = require("axios"); // For text translation

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DEEPGRAM_API_KEY = "YOUR_DEEPGRAM_API_KEY"; // Replace with your Deepgram API key
const TRANSLATION_API_URL = "https://api.mymemory.translated.net/get"; // Free translation API

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("offer", (data) => socket.broadcast.emit("offer", data));
    socket.on("answer", (data) => socket.broadcast.emit("answer", data));
    socket.on("ice-candidate", (data) => socket.broadcast.emit("ice-candidate", data));

    socket.on("chat", (msg) => socket.broadcast.emit("chat", msg));

    socket.on("start-translation", async () => {
        try {
            const deepgram = new Deepgram(DEEPGRAM_API_KEY);
            const response = await deepgram.transcription.preRecorded({ url: "https://YOUR_AUDIO_STREAM_URL" }, { language: "auto" });

            if (response.results && response.results.channels[0].alternatives[0].transcript) {
                const transcript = response.results.channels[0].alternatives[0].transcript;
                const translationResponse = await axios.get(`${TRANSLATION_API_URL}?q=${encodeURIComponent(transcript)}&langpair=auto|en`);
                const translatedText = translationResponse.data.responseData.translatedText;

                socket.emit("translated-text", translatedText);
            } else {
                socket.emit("translated-text", "No speech detected.");
            }
        } catch (error) {
            console.error("Translation Error:", error);
            socket.emit("translated-text", "Translation failed.");
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
