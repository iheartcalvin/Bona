import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot,
    doc,
    setDoc,
    getDocs,
    limit
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export const ChatService = {
    // Create or Get a Chat Session
    // For simplicity, we can have one active session per user for now, or create new ones daily
    initializeSession: async (userId) => {
        try {
            // Check for an existing active session from today
            const sessionsRef = collection(db, 'users', userId, 'chat_sessions');
            const q = query(sessionsRef, orderBy('updatedAt', 'desc'), limit(1));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const lastSession = snapshot.docs[0];
                return lastSession.id;
            }

            // Create new session
            const newSessionRef = await addDoc(sessionsRef, {
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                summary: 'New Conversation'
            });
            return newSessionRef.id;
        } catch (error) {
            console.error("Error initializing chat session:", error);
            throw error;
        }
    },

    // Send a message
    sendMessage: async (userId, sessionId, text, sender = 'user') => {
        try {
            const messagesRef = collection(db, 'users', userId, 'chat_sessions', sessionId, 'messages');
            await addDoc(messagesRef, {
                text,
                sender, // 'user' or 'bot'
                createdAt: serverTimestamp()
            });

            // Update session timestamp
            const sessionRef = doc(db, 'users', userId, 'chat_sessions', sessionId);
            await setDoc(sessionRef, {
                updatedAt: serverTimestamp(),
                lastMessage: text
            }, { merge: true });

        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    },

    // Subscribe to messages in a session
    subscribeToMessages: (userId, sessionId, callback) => {
        const messagesRef = collection(db, 'users', userId, 'chat_sessions', sessionId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                _id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
            callback(messages);
        });
    }
};
