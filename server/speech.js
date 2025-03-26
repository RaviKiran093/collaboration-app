const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');

// Initialize Google Cloud Speech-to-Text and Text-to-Speech
const speechClient = new speech.SpeechClient();
const ttsClient = new textToSpeech.TextToSpeechClient();

// Convert voice to text
async function speechToText(audioBuffer) {
    const request = {
        audio: { content: audioBuffer.toString('base64') },
        config: { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: 'en-US' }
    };

    const [response] = await speechClient.recognize(request);
    return response.results.map(result => result.alternatives[0].transcript).join('\n');
}

// Convert text to voice
async function textToSpeech(text, lang) {
    const request = {
        input: { text },
        voice: { languageCode: lang, ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' }
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    return response.audioContent;
}

module.exports = { speechToText, textToSpeech };
