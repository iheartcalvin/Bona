import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    onSnapshot,
    serverTimestamp,
    query,
    where,
    getDocs,
    addDoc,
    increment,
    Timestamp,
    deleteField,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export const SpaceService = {
    // Create a new Space Channel
    createSpace: async (hostUid, channelData) => {
        try {
            const channelRef = doc(collection(db, 'channels'));

            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 40);

            await setDoc(channelRef, {
                ...channelData,
                hostId: hostUid,
                isActive: true,
                createdAt: serverTimestamp(),
                expiresAt: Timestamp.fromDate(expiresAt),
                participantsCount: 1 // Host starts in it
            });

            // Add host as a participant with 'host' role
            await setDoc(doc(db, 'channels', channelRef.id, 'participants', hostUid), {
                uid: hostUid,
                name: channelData.hostName || 'Host',
                avatar: channelData.hostAvatar || null,
                role: 'host',
                isHandRaised: false,
                isMuted: false,
                joinedAt: serverTimestamp()
            });

            return channelRef.id;
        } catch (error) {
            console.error('Error creating space:', error);
            throw error;
        }
    },

    // Join an existing Space
    joinSpace: async (channelId, user) => {
        try {
            // Check if space is active
            const channelDoc = await getDoc(doc(db, 'channels', channelId));
            if (!channelDoc.exists() || !channelDoc.data().isActive) {
                // throw new Error("Space is no longer active");
                // Soft fail: let them see it might be closed, or handle in UI
            }

            // Add user as listener
            await setDoc(doc(db, 'channels', channelId, 'participants', user.uid), {
                uid: user.uid,
                name: user.displayName || 'Guest',
                avatar: user.photoURL || null,
                role: 'listener',
                isHandRaised: false,
                isMuted: true,
                joinedAt: serverTimestamp()
            });

            // Increment count
            await updateDoc(doc(db, 'channels', channelId), {
                participantsCount: increment(1)
            });
        } catch (error) {
            console.error('Error joining space:', error);
            throw error;
        }
    },

    // Leave a Space
    leaveSpace: async (channelId, uid) => {
        try {
            const channelRef = doc(db, 'channels', channelId);
            const channelSnap = await getDoc(channelRef);

            if (channelSnap.exists()) {
                const data = channelSnap.data();
                const isHost = data.hostId === uid;

                // If host leaves, end the whole space
                if (isHost) {
                    await updateDoc(channelRef, {
                        isActive: false,
                        participantsCount: 0,
                        endedAt: serverTimestamp()
                    });
                } else {
                    // Update participant count for non-hosts
                    const currentCount = data.participantsCount || 0;
                    await updateDoc(channelRef, {
                        participantsCount: increment(currentCount > 0 ? -1 : 0)
                    });
                }

                // Remove from participants subcollection
                await deleteDoc(doc(db, 'channels', channelId, 'participants', uid));
            }
        } catch (error) {
            console.error('Error leaving space:', error);
            throw error;
        }
    },

    // End a Space (Host only)
    endSpace: async (channelId) => {
        try {
            await updateDoc(doc(db, 'channels', channelId), {
                isActive: false,
                endedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error ending space:', error);
            throw error;
        }
    },

    // Subscribe to Space Metadata
    subscribeToSpace: (channelId, callback) => {
        return onSnapshot(doc(db, 'channels', channelId), (doc) => {
            if (doc.exists()) callback({ id: doc.id, ...doc.data() });
            else callback(null);
        });
    },

    // Subscribe to Participants
    subscribeToParticipants: (channelId, callback) => {
        const q = query(collection(db, 'channels', channelId, 'participants'));
        return onSnapshot(q, (snapshot) => {
            const participants = [];
            snapshot.forEach((doc) => {
                participants.push({ id: doc.id, ...doc.data() });
            });
            callback(participants);
        });
    },

    // Request to Speak (Raise Hand)
    requestToSpeak: async (channelId, uid) => {
        try {
            await updateDoc(doc(db, 'channels', channelId, 'participants', uid), {
                isHandRaised: true
            });
        } catch (error) {
            console.error('Error requesting to speak:', error);
        }
    },

    // Cancel Request to Speak
    cancelRequestToSpeak: async (channelId, uid) => {
        try {
            await updateDoc(doc(db, 'channels', channelId, 'participants', uid), {
                isHandRaised: false
            });
        } catch (error) {
            console.error('Error cancelling request:', error);
        }
    },

    // Promote to Speaker (Host only)
    promoteToSpeaker: async (channelId, targetUid) => {
        try {
            await updateDoc(doc(db, 'channels', channelId, 'participants', targetUid), {
                role: 'speaker',
                isHandRaised: false, // Clear hand raise
                isMuted: true // Promote but keep muted initially until they unmute
            });
        } catch (error) {
            console.error('Error promoting user:', error);
        }
    },

    // Demote to Listener (Host only)
    demoteToListener: async (channelId, targetUid) => {
        try {
            await updateDoc(doc(db, 'channels', channelId, 'participants', targetUid), {
                role: 'listener',
                isMuted: true,
                isHandRaised: false
            });
        } catch (error) {
            console.error('Error demoting user:', error);
        }
    },

    // Toggle Mute (User or Host)
    toggleMute: async (channelId, uid, isMuted) => {
        try {
            await updateDoc(doc(db, 'channels', channelId, 'participants', uid), {
                isMuted: isMuted
            });
        } catch (error) {
            console.error('Error toggling mute:', error);
        }
    },

    // Subscribe to ALL Active Spaces (for notifications)
    subscribeToActiveSpaces: (callback) => {
        const q = query(collection(db, 'channels'), where('isActive', '==', true));
        return onSnapshot(q, (snapshot) => {
            const spaces = [];
            snapshot.forEach((doc) => {
                spaces.push({ id: doc.id, ...doc.data() });
            });
            callback(spaces);
        }, (error) => {
            console.error("Error subscribing to active spaces:", error);
            callback([]);
        });
    },

    // Send Real-Time Reaction (Heart)
    cleanupStaleSpaces: async () => {
        try {
            const q = query(collection(db, 'channels'), where('isActive', '==', true));
            const snapshot = await getDocs(q);
            const now = Date.now();

            snapshot.forEach(async (channelDoc) => {
                const data = channelDoc.data();
                const isZombie = (data.participantsCount || 0) <= 0;
                const isExpired = data.expiresAt && data.expiresAt.toMillis() < now;

                if (isZombie || isExpired) {
                    await updateDoc(doc(db, 'channels', channelDoc.id), {
                        isActive: false,
                        endedAt: serverTimestamp(),
                        participantsCount: 0
                    });
                }
            });
        } catch (error) {
            console.error('Error cleaning up stale spaces:', error);
        }
    },

    // Send Real-Time Reaction (Heart)
    sendReaction: async (channelId, fromUid, type = 'heart') => {
        try {
            await addDoc(collection(db, 'channels', channelId, 'reactions'), {
                type,
                fromUid,
                createdAt: serverTimestamp(),
                ttl: Date.now() + 5000 // Client-side TTL reference 
            });
        } catch (error) {
            console.error('Error sending reaction:', error);
        }
    },

    // Subscribe to Reactions
    subscribeToReactions: (channelId, callback) => {
        const reactionsRef = collection(db, 'channels', channelId, 'reactions');
        // Limit to last 10, ordered by time.
        // In a real app we'd use a robust solution to avoid reading old ones, 
        // e.g. where createdAt > now() (requires sync clock) or listener detects 'added' type.
        // For now, simpler: user gets existing last 10 but we filter client side or just animate them.
        const q = query(reactionsRef, orderBy('createdAt', 'desc'), limit(10));

        return onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    callback({ id: change.doc.id, ...change.doc.data() });
                }
            });
        });
    },

    // Broadcast Bible Reading Progress
    broadcastReading: async (channelId, readingData) => {
        try {
            await updateDoc(doc(db, 'channels', channelId), {
                readingSync: {
                    ...readingData,
                    updatedAt: serverTimestamp()
                }
            });
        } catch (error) {
            console.error('Error broadcasting reading:', error);
        }
    }
};
