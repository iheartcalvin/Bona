// Groq API Implementation
// Make sure GROQ_API_KEY is in your .env
import { GROQ_API_KEY } from '@env';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant'; // Fast and efficient model

export const AIService = {
    /**
     * Generate response from Groq
     * @param {string} userMessage 
     * @param {Object} context - { userName, mood, recentScripture, history }
     */
    getTherapyResponse: async (userMessage, context = {}) => {
        try {
            if (!GROQ_API_KEY) {
                console.error("CRITICAL: GROQ_API_KEY is missing from environment variables.");
                throw new Error("API Key Missing");
            }

            const { userName = 'Friend', mood = 'Neutral', recentScripture = '', history = [] } = context;

            const systemPrompt = `
You are "Beloved Companion", a warm, empathetic, and spiritually grounded Christian therapy assistant. 
Your user is named ${userName}. Their current mood is "${mood}".
${recentScripture ? `They recently read ${recentScripture}.` : ''}

Guidelines:
1. Speak with kindness, wisdom, and biblical encouragement.
2. Listen to their problems and offer support based on Christian values.
3. Use scripture appropriately but don't be preachy; be a friend.
4. If they seem in crisis (suicidal, harm), heavily suggest seeking professional help immediately while offering prayer.
5. Keep responses concise (under 3-4 sentences) unless a deeper explanation is asked for.
            `;

            // Format history for OpenAI/Groq API
            const messages = [
                { role: "system", content: systemPrompt },
                ...history.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text
                })),
                { role: "user", content: userMessage }
            ];

            const response = await fetch(GROQ_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            if (!response.ok) {
                const errBody = await response.text();
                console.error("Groq Therapy API Error:", response.status, errBody);
                throw new Error(`Failed to get response from AI: ${response.status}`);
            }

            const data = await response.json();
            const aiText = data.choices?.[0]?.message?.content;

            if (!aiText) {
                console.error("Groq Response empty:", JSON.stringify(data));
                throw new Error("Empty response from AI.");
            }

            return {
                text: aiText,
                suggestedPrayer: "Peace"
            };

        } catch (error) {
            console.error('AI Service Error (getTherapyResponse):', error);
            return {
                text: "I am having a little trouble connecting right now, but please know you are loved. Check your connection or settings.",
                suggestedPrayer: "Patience"
            };
        }
    },

    generatePrayer: async (situation) => {
        try {
            if (!GROQ_API_KEY) {
                console.error("CRITICAL: GROQ_API_KEY is missing (Prayer).");
                return "Lord, we ask for your presence. Amen.";
            }

            const systemPrompt = `
You are a spiritual prayer assistant. Write a short, heartfelt, and powerful Christian prayer for the topic: "${situation}".
Keep it around 2-3 sentences. Start with a reverent address (e.g., "Heavenly Father", "Lord Jesus").
Do not include any intro/outro text, just the prayer itself.
            `;

            const response = await fetch(GROQ_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `Write a prayer for ${situation}` }
                    ],
                    temperature: 0.7,
                    max_tokens: 150
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Groq Prayer API Error:", response.status, errorBody);
                throw new Error("API Failed");
            }

            const data = await response.json();
            const aiText = data.choices?.[0]?.message?.content;

            return aiText || "Father, hear our prayer. Amen.";

        } catch (error) {
            console.error("Error generating prayer:", error);
            // Fallback
            return "Lord, we place this situation in your hands. Grant us peace and guidance. In Jesus' name, Amen.";
        }
    },

    getWordOfTheDay: async () => {
        try {
            if (!GROQ_API_KEY) {
                console.error("CRITICAL: GROQ_API_KEY is missing (WOD).");
                throw new Error("API Key Missing");
            }

            const systemPrompt = `
You are a Bible scholar. Provide one high-quality, inspirational Bible verse for a "Word of the Day" feature.
The verse should be encouraging and meaningful.
Return ONLY a JSON object in this format (no markdown):
{
  "text": "The full verse text...",
  "ref": "Book Chapter:Verse",
  "book": "Book Name",
  "chapter": "Chapter:Verse"
}
            `;

            const response = await fetch(GROQ_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: "Give me the Word of the Day." }
                    ],
                    temperature: 0.8,
                    response_format: { type: "json_object" } // Groq supports JSON mode on Llama 3
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Groq WOD API Error:", response.status, errorBody);
                throw new Error(`AI Failed: ${response.status}`);
            }

            const data = await response.json();
            const aiText = data.choices?.[0]?.message?.content;

            return JSON.parse(aiText);

        } catch (error) {
            console.error("Error generating WOD:", error);
            // Fallback to a classic verse
            return {
                text: "The Lord is my light and my salvation—whom shall I fear?",
                ref: "Psalm 27:1",
                book: "Psalm",
                chapter: "27:1"
            };
        }
    }
};
