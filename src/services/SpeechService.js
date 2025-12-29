import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { UNREAL_SPEECH_API_KEY } from '@env';

// Static list of Unreal Speech voices
const UNREAL_VOICES = [
    { identifier: 'Liv', name: 'Liv', language: 'en-US', quality: 'Ultra Realistic' }, // Professional female
    { identifier: 'Will', name: 'Will', language: 'en-US', quality: 'Ultra Realistic' }, // Deep male (good for Bible)
    { identifier: 'Scarlett', name: 'Scarlett', language: 'en-US', quality: 'Ultra Realistic' }, // Very expressive 
    { identifier: 'Amy', name: 'Amy', language: 'en-US', quality: 'Ultra Realistic' },
    { identifier: 'Dan', name: 'Dan', language: 'en-US', quality: 'Ultra Realistic' }
];

class SpeechService {
    constructor() {
        this.sound = null;
        this.isPaused = false;
        this.currentUri = null;
        this.onPlaybackStatusUpdate = null;
        this._initAudio();
    }

    async _initAudio() {
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
            });
        } catch (e) {
            console.error("Audio init failed", e);
        }
    }

    async getAvailableVoices() {
        // Return our predefined high-quality list
        return UNREAL_VOICES;
    }

    /**
     * Helper to split text into chunks < 1000 chars (API Limit)
     */
    chunkText(text, maxLength = 900) {
        const chunks = [];
        // 1. Clean text
        const cleanText = text.replace(/\s+/g, ' ').trim();

        // 2. Split into rough "sentences"
        const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];

        let currentChunk = '';

        for (const sentence of sentences) {
            // Case A: Sentence itself is too huge? (rare in Bible, but possible in logs/dumps)
            if (sentence.length > maxLength) {
                // Flush current chunk if any
                if (currentChunk.trim()) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }

                // Hard split the long sentence
                let remaining = sentence;
                while (remaining.length > 0) {
                    let slice = remaining.slice(0, maxLength);
                    // Try to cut at last space to be nice
                    const lastSpace = slice.lastIndexOf(' ');
                    if (lastSpace > 0 && remaining.length > maxLength) {
                        slice = slice.slice(0, lastSpace);
                    }
                    chunks.push(slice.trim());
                    remaining = remaining.slice(slice.length).trim();
                }
                continue; // Sentence handled
            }

            // Case B: Normal accumulation
            if ((currentChunk + sentence).length > maxLength) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        }

        if (currentChunk.trim()) chunks.push(currentChunk.trim());
        return chunks;
    }

    /**
     * Stream audio from Unreal Speech API (Handles Chunking)
     * @param {string} text - Text to speak
     * @param {object} options
     */
    async speak(text, options = {}) {
        try {
            await this.stop(); // Stop any previous playback
            if (!text) return;

            const chunks = this.chunkText(text);
            this.queue = chunks; // Store chunks to play sequentially
            this.currentChunkIndex = 0;
            this.options = options;
            this.isPlayingQueue = true;

            await this.playNextChunk();

        } catch (error) {
            console.error("SpeechService Error:", error);
            if (options.onError) options.onError(error);
        }
    }

    async playNextChunk() {
        if (!this.isPlayingQueue || this.currentChunkIndex >= this.queue.length) {
            this.isPlayingQueue = false;
            if (this.options?.onDone) this.options.onDone();
            return;
        }

        const textChunk = this.queue[this.currentChunkIndex];
        // console.log(`Playing chunk ${this.currentChunkIndex + 1}/${this.queue.length}`);

        try {
            console.log("Fetching audio chunk...");
            // Check before fetch
            if (!this.isPlayingQueue) return;

            const fileUri = await this.fetchAudio(textChunk, this.options);

            // Check after fetch (user might have stopped)
            if (!this.isPlayingQueue) return;

            console.log("Audio fetched to:", fileUri);
            await this.playAudio(fileUri);
        } catch (error) {
            console.error("Chunk Error:", error);
            // Move to next even if error? Or stop?
            // Let's try to continue 
            this.currentChunkIndex++;
            this.playNextChunk();
        }
    }

    async fetchAudio(text, options) {
        if (!UNREAL_SPEECH_API_KEY) throw new Error("API Key Missing");

        const voiceId = options.voice || 'Will';
        const safeTextEntry = text.substring(0, 10).replace(/[^a-z0-9]/gi, '');
        const fileName = `speech_${safeTextEntry}_${Date.now()}.mp3`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        console.log("Fetching audio chunk (POST)...");

        try {
            const response = await fetch('https://api.v7.unrealspeech.com/stream', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${UNREAL_SPEECH_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Text: text,
                    VoiceId: voiceId,
                    Bitrate: '192k',
                    Speed: '0',
                    Pitch: '1.0',
                    Codec: 'libmp3lame'
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("Unreal API Status:", response.status, errText);
                throw new Error(`Unreal API Failed: ${response.status} ${errText}`);
            }

            console.log("Unreal API Success, processing blob...");

            // blob() -> FileReader is often buggy in RN for binary
            // Try careful FileReader handling
            const blob = await response.blob();

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async () => {
                    try {
                        const base64data = reader.result.split(',')[1];
                        await FileSystem.writeAsStringAsync(fileUri, base64data, { encoding: FileSystem.EncodingType.Base64 });
                        console.log("File saved to:", fileUri);
                        resolve(fileUri);
                    } catch (e) {
                        console.error("File write error:", e);
                        reject(e);
                    }
                };
                reader.onerror = (e) => {
                    console.error("FileReader Error:", e);
                    reject(new Error("FileReader failed"));
                };
                reader.readAsDataURL(blob);
            });

        } catch (error) {
            console.error("Fetch/Save Error:", error);
            throw error;
        }
    }

    async playAudio(uri) {
        console.log("Attempting to load sound:", uri);
        return new Promise(async (resolve, reject) => {
            try {
                // Respect isPaused state when creating sound
                const shouldPlay = !this.isPaused;

                const { sound, status } = await Audio.Sound.createAsync(
                    { uri },
                    { shouldPlay: shouldPlay, rate: this.options?.rate || 1.0, volume: 1.0 }
                );

                console.log("Sound loaded. Status:", status);
                this.sound = sound;

                // If we were paused, we don't reset isPaused to false here. 
                // We just stay paused. 
                // However, playNextChunk expects us to be playing? 
                // No, playNextChunk just waits for "didJustFinish".
                // If we are paused, "didJustFinish" won't happen until user Resumes. 
                // This is correct behavior!

                this.sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.didJustFinish) {
                        console.log("Playback finished chunk.");
                        this.sound.unloadAsync();
                        this.sound = null;
                        this.currentChunkIndex++;
                        this.playNextChunk(); // Trigger next
                        resolve(); // Resolve this specific chunk play
                    }
                });

            } catch (error) {
                console.error("Audio.createAsync Error:", error);
                reject(error);
            }
        });
    }

    async stop() {
        this.isPlayingQueue = false; // Kill the queue loop
        this.queue = [];
        this.currentChunkIndex = 0;

        if (this.sound) {
            await this.sound.stopAsync();
            await this.sound.unloadAsync();
            this.sound = null;
        }
        this.isPaused = false;
    }

    async pause() {
        this.isPaused = true;
        if (this.sound) {
            await this.sound.pauseAsync();
        }
    }

    async resume() {
        this.isPaused = false;
        if (this.sound) {
            await this.sound.playAsync();
        } else {
            // If we resumed but no sound exists (maybe we paused during fetch?),
            // we should trigger playNextChunk if we have a queue?
            // Actually playNextChunk is probably waiting at "await playAudio" or getting called.
            // If we paused during fetch, playAudio will create sound with shouldPlay=false.
            // Then user clicks resume -> this.sound.playAsync() works. Correct.
        }
    }

    async isSpeaking() {
        if (!this.sound) return false;
        const status = await this.sound.getStatusAsync();
        return status.isPlaying;
    }
}

export default new SpeechService();
