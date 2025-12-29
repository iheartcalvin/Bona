import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { AIService } from './aiService';

export const WordOfDayService = {
    /**
     * Get the word of the day.
     * Checks Firestore first, generates via AI if not found for today.
     */
    getDailyVerse: async () => {
        try {
            // Calculate today's ID based on 6am pivot
            const now = new Date();
            const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;
            const localTimestamp = now.getTime() - timezoneOffsetMs;
            const sixAmOffset = 6 * 60 * 60 * 1000;

            // Deterministic date string for the 6am-to-6am period
            const periodDate = new Date(localTimestamp - sixAmOffset);
            const dateId = periodDate.toISOString().split('T')[0]; // YYYY-MM-DD

            const docRef = doc(db, 'daily_wod', dateId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data();
            }

            // Not found, generate via AI
            console.log("Generating new WOD for", dateId);
            const newVerse = await AIService.getWordOfTheDay();

            // Save to Firestore so others can see it
            // Note: If multiple people trigger this at once, the first one wins
            // or they just overwrite with slightly different AI responses, which is fine.
            const wodData = {
                ...newVerse,
                generatedAt: serverTimestamp(),
                dateId: dateId
            };

            await setDoc(docRef, wodData);
            return wodData;

        } catch (error) {
            console.error("Error in WordOfDayService:", error);
            // Fallback
            return {
                text: "The Lord is my light and my salvation—whom shall I fear?",
                ref: "Psalm 27:1",
                book: "Psalm",
                chapter: "27:1"
            };
        }
    }
};
