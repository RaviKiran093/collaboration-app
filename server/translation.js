const { translateText } = require("./translation"); // Import translation module

socket.on("start-translation", async () => {
    try {
        const deepgram = new Deepgram(DEEPGRAM_API_KEY);
        const response = await deepgram.transcription.preRecorded(
            { url: "https://YOUR_AUDIO_STREAM_URL" }, 
            { language: "auto" }
        );

        if (response.results && response.results.channels[0].alternatives[0].transcript) {
            const transcript = response.results.channels[0].alternatives[0].transcript;
            
            // ✅ Log the recognized speech
            console.log("Recognized speech:", transcript);

            // ✅ Use Google Translate instead of MyMemory API
            const translatedText = await translateText(transcript, "en");

            // ✅ Log the translated text
            console.log("Translated text:", translatedText);

            // Send translated text back to client
            socket.emit("translated-text", translatedText);
        } else {
            socket.emit("translated-text", "No speech detected.");
        }
    } catch (error) {
        console.error("Translation Error:", error);
        socket.emit("translated-text", "Translation failed.");
    }
});
