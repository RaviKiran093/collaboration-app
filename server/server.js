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

            // Translate to English
            const translationResponse = await axios.get(`${TRANSLATION_API_URL}?q=${encodeURIComponent(transcript)}&langpair=auto|en`);
            const translatedText = translationResponse.data.responseData.translatedText;

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

