const chunkCache = new Map();

export const BibleService = {
    /**
     * Fetches a specific chapter from the Bible.
     * @param {string} book - The name of the book (e.g., 'John').
     * @param {number} chapter - The chapter number.
     * @returns {Promise<string>} - The text of the chapter.
     */
    getChapter: async (book, chapter) => {
        const cacheKey = `chapter_${book}_${chapter}`;
        if (chunkCache.has(cacheKey)) {
            return chunkCache.get(cacheKey);
        }

        try {
            // Encode book name to handle spaces (e.g., "1 Samuel")
            const url = `https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=kjv`;
            const response = await fetch(url);

            if (response.status === 429) {
                throw new Error('You are reading too fast! Please wait a moment for the text to load.');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            try {
                const data = JSON.parse(text);
                chunkCache.set(cacheKey, data);
                return data;
            } catch (e) {
                console.error('JSON Parse Error. Response text:', text);
                throw new Error('Invalid JSON response from Bible API');
            }
        } catch (error) {
            console.error('Error fetching Bible chapter:', error);
            throw error;
        }
    },

    /**
     * Fetches a specific verse.
     * @param {string} book 
     * @param {number} chapter 
     * @param {number} verse 
     * @returns {Promise<string>}
     */
    getVerse: async (book, chapter, verse) => {
        const cacheKey = `verse_${book}_${chapter}_${verse}`;
        if (chunkCache.has(cacheKey)) {
            return chunkCache.get(cacheKey);
        }

        try {
            const url = `https://bible-api.com/${encodeURIComponent(book)}+${chapter}:${verse}?translation=kjv`;
            const response = await fetch(url);

            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment.');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            try {
                const data = JSON.parse(text);
                chunkCache.set(cacheKey, data.text);
                return data.text;
            } catch (e) {
                console.error('JSON Parse Error in getVerse. Response text:', text);
                throw new Error('Invalid JSON response from Bible API');
            }
        } catch (error) {
            console.error('Error fetching Bible verse:', error);
            throw error;
        }
    }
};
