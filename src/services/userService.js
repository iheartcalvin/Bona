import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    onSnapshot,
    runTransaction,
    increment,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    orderBy,
    limit,
    deleteDoc,
    writeBatch,
    getCountFromServer
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebaseConfig';
import * as FileSystem from 'expo-file-system/legacy';

export const UserService = {
    // Check if username is available
    checkUsernameAvailability: async (username) => {
        if (!username) return false;
        try {
            const q = query(
                collection(db, 'users'),
                where('username', '==', username.toLowerCase()),
                limit(1)
            );
            const snapshot = await getDocs(q);
            return snapshot.empty;
        } catch (error) {
            console.error("Error checking username:", error);
            throw error;
        }
    },

    // Get user email by username (For login)
    getUserByUsername: async (username) => {
        if (!username) return null;
        try {
            const q = query(
                collection(db, 'users'),
                where('username', '==', username.toLowerCase()),
                limit(1)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const userDoc = snapshot.docs[0];
                return { uid: userDoc.id, ...userDoc.data() };
            }
            return null;
        } catch (error) {
            console.error("Error fetching user by username:", error);
            throw error;
        }
    },

    // Create initial user profile on Sign Up
    createUserProfile: async (uid, userData) => {
        try {
            await setDoc(doc(db, 'users', uid), {
                ...userData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                plan: 'free',
                followersCount: 0,
                followingCount: 0,
                mood: { icon: '🙏', label: 'Blessed' },
                settings: {
                    privacy: 'Public',
                    notifications: true // Default setting
                },
                stats: {
                    versesReflected: 0,
                    completedPrayers: 0,
                    donations: 0
                }
            });
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    },

    // Real-time subscription to user profile
    subscribeToUserProfile: (uid, callback) => {
        const userRef = doc(db, 'users', uid);
        return onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                callback(doc.data());
            } else {
                callback(null);
            }
        }, (error) => {
            console.error('Error subscribing to user profile:', error);
        });
    },

    // Get user profile data (one-time fetch)
    getUserProfile: async (uid) => {
        try {
            const documentSnapshot = await getDoc(doc(db, 'users', uid));
            if (documentSnapshot.exists()) {
                return documentSnapshot.data();
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },

    // Update specific fields
    updateUserProfile: async (uid, data) => {
        try {
            await updateDoc(doc(db, 'users', uid), {
                ...data,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },

    // Update User Settings
    updateUserSettings: async (uid, settings) => {
        try {
            await updateDoc(doc(db, 'users', uid), {
                settings: settings,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    },

    // Upload Profile Image
    // Upload Profile Image (Base64 Fallback for Firestore)
    uploadProfileImage: async (uid, uri) => {
        try {
            // Read file as Base64
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            // Return Data URI to be saved as the photoURL
            return `data:image/jpeg;base64,${base64}`;
        } catch (error) {
            console.error("Error converting profile image:", error);
            throw error;
        }
    },

    // Save expo push token
    savePushToken: async (uid, token) => {
        if (!uid || !token) return;
        try {
            await updateDoc(doc(db, 'users', uid), {
                pushToken: token,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error saving push token:", error);
            // Don't throw, just log
        }
    },


    // Update User Mood
    updateUserMood: async (uid, mood) => {
        try {
            await updateDoc(doc(db, 'users', uid), {
                mood: mood,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating mood:', error);
            throw error;
        }
    },

    // Follow a user
    followUser: async (currentUid, targetUid) => {
        if (!currentUid || !targetUid || currentUid === targetUid) return;

        const currentUserRef = doc(db, 'users', currentUid);
        const targetUserRef = doc(db, 'users', targetUid);
        const followingRef = doc(db, 'users', currentUid, 'following', targetUid);
        const followerRef = doc(db, 'users', targetUid, 'followers', currentUid);

        try {
            await runTransaction(db, async (transaction) => {
                // Check if already following
                const followingDoc = await transaction.get(followingRef);
                if (followingDoc.exists()) throw new Error('Already following');

                // Add to "following" subcollection of current user
                transaction.set(followingRef, {
                    followedAt: serverTimestamp()
                });

                // Add to "followers" subcollection of target user
                transaction.set(followerRef, {
                    followedAt: serverTimestamp()
                });

                // Increment counts (Only for current user to avoid permission issues)
                transaction.update(currentUserRef, { followingCount: increment(1) });
                // transaction.update(targetUserRef, { followersCount: increment(1) });
            });
        } catch (error) {
            console.error('Error following user:', error);
            throw error;
        }
    },

    // Unfollow a user
    unfollowUser: async (currentUid, targetUid) => {
        if (!currentUid || !targetUid) return;

        const currentUserRef = doc(db, 'users', currentUid);
        const targetUserRef = doc(db, 'users', targetUid);
        const followingRef = doc(db, 'users', currentUid, 'following', targetUid);
        const followerRef = doc(db, 'users', targetUid, 'followers', currentUid);

        try {
            await runTransaction(db, async (transaction) => {
                // Check if following exists
                const followingDoc = await transaction.get(followingRef);
                if (!followingDoc.exists()) throw new Error('Not following');

                // Remove from subcollections
                transaction.delete(followingRef);
                transaction.delete(followerRef);

                // Decrement counts (Only for current user)
                transaction.update(currentUserRef, { followingCount: increment(-1) });
                // transaction.update(targetUserRef, { followersCount: increment(-1) });
            });
        } catch (error) {
            console.error('Error unfollowing user:', error);
            throw error;
        }
    },

    // --- Fellowship / Friend Request System ---

    // Subscribe to Friend Requests
    subscribeToFriendRequests: (uid, callback) => {
        if (!uid) return () => { };
        const requestsRef = collection(db, 'users', uid, 'requests');
        // Order by timestamp desc
        const q = query(requestsRef, orderBy('createdAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(requests);
        }, (error) => {
            console.error("Error subscribing to friend requests:", error);
            callback([]);
        });
    },

    // Send Friend Request
    sendFriendRequest: async (currentUid, currentName, currentAvatar, targetUid) => {
        if (!currentUid || !targetUid || currentUid === targetUid) return;
        const requestRef = doc(db, 'users', targetUid, 'requests', currentUid);

        try {
            await setDoc(requestRef, {
                fromUid: currentUid,
                name: currentName || 'Unknown',
                avatar: currentAvatar || null,
                type: 'Friend Request',
                createdAt: serverTimestamp(),
                status: 'pending'
            });
        } catch (error) {
            console.error("Error sending friend request:", error);
            throw error;
        }
    },

    // Cancel Sent Friend Request
    cancelFriendRequest: async (currentUid, targetUid) => {
        if (!currentUid || !targetUid) return;
        try {
            // Find the request document
            const targetRequestsRef = collection(db, 'users', targetUid, 'requests');
            const q = query(targetRequestsRef, where('fromUid', '==', currentUid), where('status', '==', 'pending'));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Delete all matching requests (should be only one usually)
                const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);
            }
        } catch (error) {
            console.error("Error cancelling friend request:", error);
            throw error;
        }
    },

    // Accept Friend Request (Acccepting establishes MUTUAL following)
    acceptFriendRequest: async (currentUid, request) => {
        // currentUid is the one ACCEPTING (The Receiver)
        // request.fromUid is the one who SENT the request (The Requestor)

        if (!currentUid || !request?.fromUid) return;

        const targetUid = request.fromUid; // The original sender
        const requestRef = doc(db, 'users', currentUid, 'requests', targetUid);

        try {
            await runTransaction(db, async (transaction) => {
                const requestDoc = await transaction.get(requestRef);
                if (!requestDoc.exists()) throw new Error("Request does not exist");

                // --- ESTABLISH THE MUTUAL FOLLOW ---
                const timestamp = serverTimestamp();

                // 1. A follows B
                const aFollowingB = doc(db, 'users', currentUid, 'following', targetUid);
                const bFollowerA = doc(db, 'users', targetUid, 'followers', currentUid);
                transaction.set(aFollowingB, { followedAt: timestamp });
                transaction.set(bFollowerA, { followedAt: timestamp });

                // 2. B follows A
                const bFollowingA = doc(db, 'users', targetUid, 'following', currentUid);
                const aFollowerB = doc(db, 'users', currentUid, 'followers', targetUid);
                transaction.set(bFollowingA, { followedAt: timestamp });
                transaction.set(aFollowerB, { followedAt: timestamp });

                // 3. Update Counts for User A (Owner can only update own fields)
                // Note: User B counts will stay static until they login or we use a function.
                // However, we now use real-time counts from subcollections in the UI.
                const userARef = doc(db, 'users', currentUid);
                transaction.update(userARef, {
                    followingCount: increment(1),
                    followersCount: increment(1)
                });

                // 4. Delete the request
                transaction.delete(requestRef);
            });
        } catch (error) {
            console.error("Error accepting friend request:", error);
            throw error;
        }
    },

    // Reject Friend Request
    rejectFriendRequest: async (currentUid, requestId) => {
        if (!currentUid || !requestId) return;
        const requestRef = doc(db, 'users', currentUid, 'requests', requestId);
        try {
            await deleteDoc(requestRef);
        } catch (error) {
            console.error("Error rejecting friend request:", error);
            throw error;
        }
    },

    // Check Relationship Status
    checkRelationshipStatus: async (currentUid, targetUid) => {
        if (!currentUid || !targetUid) return 'not_following';

        try {
            // 1. Check if already following
            const followingRef = doc(db, 'users', currentUid, 'following', targetUid);
            const followingDoc = await getDoc(followingRef);
            if (followingDoc.exists()) return 'following';

            // 2. Check if request is pending (We need to query target's requests where fromUid == currentUid)
            const targetRequestsRef = collection(db, 'users', targetUid, 'requests');
            const q = query(targetRequestsRef, where('fromUid', '==', currentUid), where('status', '==', 'pending'));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) return 'requested';

            return 'not_following';
        } catch (error) {
            console.error("Error checking relationship:", error);
            return 'not_following';
        }
    },

    // Save Bible Progress (Last Read, History, Completed Chapters)
    saveBibleProgress: async (uid, bookName, chapter, verse = "1") => {
        if (!uid) return;
        const userRef = doc(db, 'users', uid);

        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) return;

                const data = userDoc.data();
                let history = data.readingHistory || [];

                // Remove existing entry for this book to avoid duplicates and always replace with latest
                history = history.filter(h => h.book !== bookName);

                // Add new entry to the top
                const newEntry = {
                    book: bookName,
                    chapter: chapter,
                    verse: verse,
                    title: `${bookName} ${chapter}:${verse}`, // Friendly title
                    timestamp: new Date().toISOString() // Store as string for flexibility
                };
                history.unshift(newEntry);

                // Keep only last 5 items
                if (history.length > 5) history = history.slice(0, 5);

                // Update Completed Chapters (Map: "Genesis": [1, 2, 3])
                let completed = data.completedChapters || {};
                if (!completed[bookName]) completed[bookName] = [];
                if (!completed[bookName].includes(chapter)) {
                    completed[bookName].push(chapter);
                }

                transaction.update(userRef, {
                    readingHistory: history,
                    completedChapters: completed,
                    lastRead: newEntry,
                    updatedAt: serverTimestamp()
                });
            });
        } catch (error) {
            console.error("Error saving bible progress:", error);
        }
    },

    // Subscribe to Bible Data specifically (if we needed separate listener, but subscribeToUserProfile covers it)
    // We can just rely on the existing subscribeToUserProfile since we are modifying the 'users' doc.

    // --- Prayer Service Methods ---

    // Subscribe to Prayer Schedule
    subscribeToPrayerSchedule: (uid, callback) => {
        if (!uid) return () => { };
        const scheduleRef = collection(db, 'users', uid, 'prayerSchedule');
        // Assuming schedule has 'time' or 'order' field. ordering by time for now.
        // If data isn't there yet, it will just be empty.
        const q = query(scheduleRef, orderBy('time', 'asc'));

        return onSnapshot(q, (snapshot) => {
            const schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(schedules);
        }, (error) => {
            console.error("Error subscribing to prayer schedule:", error);
            callback([]);
        });
    },

    // Subscribe to Prayer History (Recent completed prayers, last 7 days)
    subscribeToPrayerHistory: (uid, limitCount = 5, callback) => {
        if (!uid) return () => { };

        const historyRef = collection(db, 'users', uid, 'prayerHistory');

        // Calculate 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Query: Completed after 7 days ago, ordered by date desc
        const q = query(
            historyRef,
            where('completedAt', '>=', sevenDaysAgo),
            orderBy('completedAt', 'desc'),
            limit(limitCount)
        );

        return onSnapshot(q, (snapshot) => {
            const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(history);
        }, (error) => {
            console.error("Error subscribing to prayer history:", error);
            callback([]);
        });
    },

    // Fetch extended prayer history for analytics (e.g., last 30 days)
    getExtendedPrayerHistory: async (uid, days = 30) => {
        if (!uid) return [];
        const historyRef = collection(db, 'users', uid, 'prayerHistory');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        try {
            const q = query(
                historyRef,
                where('completedAt', '>=', startDate),
                orderBy('completedAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching extended prayer history:", error);
            return [];
        }
    },

    // Mark Prayer as Complete
    markPrayerComplete: async (uid, sessionData) => {
        if (!uid) return;
        const userRef = doc(db, 'users', uid);
        const historyRef = collection(db, 'users', uid, 'prayerHistory');

        try {
            await runTransaction(db, async (transaction) => {
                // 1. Add to prayerHistory subcollection
                // Note: runTransaction doesn't support addDoc directly for generated IDs easily in all SDKs, 
                // but we can use setDoc with a new doc ref. 
                // Or simply use batch/independent writes if strict atomicity isn't 100% required for the log, 
                // but checking user existence first is good.

                // For simplicity in transaction (to ensure increment works only if user exists):
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) {
                    // Create the user doc if it doesn't exist
                    transaction.set(userRef, {
                        uid: uid,
                        email: "generated@user.com", // Placeholder or fetch from auth if passed
                        createdAt: serverTimestamp(),
                        stats: { completedPrayers: 1 },
                        updatedAt: serverTimestamp()
                    });
                } else {
                    // 2. Increment completedPrayers stats
                    transaction.update(userRef, {
                        'stats.completedPrayers': increment(1),
                        updatedAt: serverTimestamp()
                    });
                }

                const newHistoryRef = doc(historyRef); // generate new Id
                transaction.set(newHistoryRef, {
                    ...sessionData,
                    completedAt: serverTimestamp(),
                    date: new Date().toISOString() // for easier formatted display backup
                });
            });
        } catch (error) {
            console.error("Error marking prayer complete:", error);
            throw error;
        }
    },

    // Add Scheduled Prayer
    addScheduledPrayer: async (uid, prayerData) => {
        if (!uid) return;
        const scheduleRef = collection(db, 'users', uid, 'prayerSchedule');
        try {
            await addDoc(scheduleRef, {
                ...prayerData,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error adding scheduled prayer:", error);
            throw error;
        }
    },

    // Update Scheduled Prayer
    updateScheduledPrayer: async (uid, prayerId, prayerData) => {
        if (!uid || !prayerId) return;
        const prayerRef = doc(db, 'users', uid, 'prayerSchedule', prayerId);
        try {
            await updateDoc(prayerRef, {
                ...prayerData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating scheduled prayer:", error);
            throw error;
        }
    },

    // Delete Scheduled Prayer
    deleteScheduledPrayer: async (uid, prayerId) => {
        if (!uid || !prayerId) return;
        const prayerRef = doc(db, 'users', uid, 'prayerSchedule', prayerId);
        try {
            await deleteDoc(prayerRef);
        } catch (error) {
            console.error("Error deleting scheduled prayer:", error);
            throw error;
        }
    },

    // Subscribe to General Notifications
    subscribeToNotifications: (uid, callback) => {
        if (!uid) return () => { };
        const notifRef = collection(db, 'users', uid, 'notifications');
        // Order by timestamp desc
        const q = query(notifRef, orderBy('createdAt', 'desc'), limit(20));

        return onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(notifs);
        }, (error) => {
            console.error("Error subscribing to notifications:", error);
            callback([]);
        });
    }
    ,


    // Mark notifications as read (Batch)
    markNotificationsRead: async (uid, notificationIds) => {
        if (!uid || !notificationIds || notificationIds.length === 0) return;
        const batch = writeBatch(db);
        notificationIds.forEach(id => {
            const ref = doc(db, 'users', uid, 'notifications', id);
            batch.update(ref, { read: true });
        });
        await batch.commit();
    },

    // Delete all notifications (Batch)
    deleteAllNotifications: async (uid, notificationIds) => {
        if (!uid || !notificationIds || notificationIds.length === 0) return;
        const batch = writeBatch(db);
        notificationIds.forEach(id => {
            const ref = doc(db, 'users', uid, 'notifications', id);
            batch.delete(ref);
        });
        await batch.commit();
    },

    // Get Followers (Full Details)
    getUserFollowers: async (uid) => {
        if (!uid) return [];
        try {
            const followersRef = collection(db, 'users', uid, 'followers');
            const q = query(followersRef, limit(50)); // Limit for performance
            const snapshot = await getDocs(q);

            if (snapshot.empty) return [];

            const followerIds = snapshot.docs.map(doc => doc.id);

            // Fetch user profiles in parallel
            const followers = await Promise.all(followerIds.map(async (followerId) => {
                const userDoc = await getDoc(doc(db, 'users', followerId));
                if (userDoc.exists()) {
                    return { uid: userDoc.id, ...userDoc.data() };
                }
                return null;
            }));

            // Filter out any nulls (deleted users)
            return followers.filter(user => user !== null);
        } catch (error) {
            console.error("Error fetching followers:", error);
            return [];
        }
    },

    // Get Following (Full Details)
    getUserFollowing: async (uid) => {
        if (!uid) return [];
        try {
            const followingRef = collection(db, 'users', uid, 'following');
            const q = query(followingRef, limit(50));
            const snapshot = await getDocs(q);

            if (snapshot.empty) return [];

            const followingIds = snapshot.docs.map(doc => doc.id);

            const following = await Promise.all(followingIds.map(async (followingId) => {
                const userDoc = await getDoc(doc(db, 'users', followingId));
                if (userDoc.exists()) {
                    return { uid: userDoc.id, ...userDoc.data() };
                }
                return null;
            }));

            return following.filter(user => user !== null);
        } catch (error) {
            console.error("Error fetching following:", error);
            return [];
        }
    },

    // Subscribe for Real-time counts (Subcollection based)
    subscribeToUserCounts: (uid, callback) => {
        if (!uid) return () => { };

        let followers = 0;
        let following = 0;

        const unsubFollowers = onSnapshot(collection(db, 'users', uid, 'followers'), (snapshot) => {
            followers = snapshot.size;
            callback({ followers, following });
        });

        const unsubFollowing = onSnapshot(collection(db, 'users', uid, 'following'), (snapshot) => {
            following = snapshot.size;
            callback({ followers, following });
        });

        return () => {
            unsubFollowers();
            unsubFollowing();
        };
    },

    // Get Actual Counts (Aggregation)
    getUserCounts: async (uid) => {
        if (!uid) return { followers: 0, following: 0 };
        try {
            const followersColl = collection(db, 'users', uid, 'followers');
            const followingColl = collection(db, 'users', uid, 'following');

            const followersSnapshot = await getCountFromServer(followersColl);
            const followingSnapshot = await getCountFromServer(followingColl);

            return {
                followers: followersSnapshot.data().count,
                following: followingSnapshot.data().count
            };
        } catch (error) {
            console.error("Error fetching user counts:", error);
            return { followers: 0, following: 0 };
        }
    },

    // Save Highlight
    saveHighlight: async (uid, highlightData) => {
        if (!uid) return;
        const highlightsRef = doc(db, 'users', uid, 'highlights', highlightData.id);
        try {
            await setDoc(highlightsRef, {
                ...highlightData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error saving highlight", error);
        }
    },

    // Subscribe to Highlights
    subscribeToHighlights: (uid, callback) => {
        if (!uid) return () => { };
        const highlightsRef = collection(db, 'users', uid, 'highlights');
        return onSnapshot(highlightsRef, (snapshot) => {
            const highlights = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                highlights[doc.id] = data.color;
            });
            callback(highlights);
        }, (error) => {
            console.error("Error fetching highlights", error);
            callback({});
        });
    },

    // Subscribe to Full Highlights List (for Dashboard)
    subscribeToFullHighlights: (uid, callback) => {
        if (!uid) return () => { };
        const highlightsRef = collection(db, 'users', uid, 'highlights');
        // Simple query for now
        const q = query(highlightsRef);
        return onSnapshot(q, (snapshot) => {
            const highlights = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(highlights);
        }, (error) => {
            console.error("Error fetching full highlights", error);
            callback([]);
        });
    },

    // Delete Highlight
    deleteHighlight: async (uid, highlightId) => {
        if (!uid || !highlightId) return;
        try {
            await deleteDoc(doc(db, 'users', uid, 'highlights', highlightId));
        } catch (error) {
            console.error("Error deleting highlight", error);
        }
    },

    // --- Rewards System ---

    // Save a new Reward (Badge)
    saveReward: async (uid, rewardData) => {
        if (!uid || !rewardData) return;

        // rewardData should have: { book: 'Genesis', tier: 'Gold', points: 100 }
        // We can create a composite ID to prevent duplicates (e.g., "Genesis_Gold")
        const rewardId = `${rewardData.book}_${rewardData.tier}`;
        const rewardRef = doc(db, 'users', uid, 'rewards', rewardId);
        const userRef = doc(db, 'users', uid);

        try {
            await runTransaction(db, async (transaction) => {
                const rewardDoc = await transaction.get(rewardRef);
                if (rewardDoc.exists()) return; // Already earned this specific badge

                // 1. Save Reward
                transaction.set(rewardRef, {
                    ...rewardData,
                    earnedAt: serverTimestamp()
                });

                // 2. Increment Total Points
                transaction.update(userRef, {
                    'stats.totalPoints': increment(rewardData.points || 0),
                    updatedAt: serverTimestamp()
                });
            });
        } catch (error) {
            console.error("Error saving reward:", error);
            throw error;
        }
    },

    // Subscribe to User Rewards
    subscribeToUserRewards: (uid, callback) => {
        if (!uid) return () => { };
        const rewardsRef = collection(db, 'users', uid, 'rewards');
        const q = query(rewardsRef, orderBy('earnedAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const rewards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(rewards);
        }, (error) => {
            console.error("Error subscribing to rewards:", error);
            callback([]);
        });
    }
};

