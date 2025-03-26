const { Translate } = require('@google-cloud/translate').v2;

// Initialize Google Cloud Translate
const translate = new Translate();

async function translateText(text, targetLang) {
    try {
        let [translatedText] = await translate.translate(text, targetLang);
        return translatedText;
    } catch (error) {
        console.error('Error translating text:', error);
        throw error;
    }
}

module.exports = { translateText };
