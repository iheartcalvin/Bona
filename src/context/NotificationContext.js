import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../services/firebaseConfig';
import { UserService } from '../services/userService';
import { SpaceService } from '../services/SpaceService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [user, setUser] = useState(null);

    // Initial loading or persisting can be handled here if needed
    // For now, simple in-memory state derived from subscriptions

    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribeAuth();
    }, []);

    // Subscribe to Profile for lastNotificationViewedAt
    useEffect(() => {
        if (user) {
            const unsubProfile = UserService.subscribeToUserProfile(user.uid, (data) => {
                setUserProfile(data);
            });
            return () => unsubProfile();
        } else {
            setUserProfile(null);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        let prayerSchedule = [];
        let activeSpaces = [];
        let userNotifications = [];

        // Helper to recalculate count
        const calculateCount = () => {
            if (!user) return;
            let count = 0;
            // Use Profile data
            const lastViewed = userProfile?.lastNotificationViewedAt ? new Date(userProfile.lastNotificationViewedAt).getTime() : 0;
            const now = new Date();

            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            // 1. Unread User Notifications (Firestore State)
            // Even if seen before, if read=false in DB, we count it. 
            // The screen view updates read=true, so this self-corrects.
            count += userNotifications.filter(n => !n.read).length;

            // 2. Active Spaces
            // Count if created AFTER last viewed? 
            // Or just count them if they are live? Usually Live badges stay.
            // But user asked to hide if viewed.
            // Let's assume we check if the space started AFTER lastViewed.
            // Space object might need createdAt. Assuming it has it or we just use length if strictly "new".
            // If we strictly want to hide badge after viewing screen:
            // Filter spaces where createdAt > lastViewed.
            const newSpaces = activeSpaces.filter(s => {
                const created = s.createdAt?.toDate ? s.createdAt.toDate().getTime() : (s.startedAt || 0);
                return created > lastViewed;
            });
            count += newSpaces.length;

            // 3. Schedule Alerts
            if (prayerSchedule.length > 0) {
                const parseTimeToMinutes = (timeStr) => {
                    if (!timeStr) return -1;
                    const [time, modifier] = timeStr.split(' ');
                    let [hours, minutes] = time.split(':').map(Number);
                    if (modifier) {
                        if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
                        if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
                    }
                    return hours * 60 + minutes;
                };

                const getPrayerTimeToday = (minutes) => {
                    const d = new Date();
                    d.setHours(Math.floor(minutes / 60));
                    d.setMinutes(minutes % 60);
                    d.setSeconds(0);
                    return d.getTime();
                };

                prayerSchedule.forEach(item => {
                    const prayerMinutes = parseTimeToMinutes(item.time);
                    const prayerTimeMs = getPrayerTimeToday(prayerMinutes);

                    let isAlert = false;

                    // Missed: Time passed > 15 mins
                    if (prayerMinutes < currentMinutes && (currentMinutes - prayerMinutes) > 15) {
                        isAlert = true;
                    }
                    // Upcoming: Within 60 mins
                    else if (prayerMinutes > currentMinutes && (prayerMinutes - currentMinutes) <= 60) {
                        isAlert = true;
                    }

                    // Only count if the "Event" happened AFTER the last view 
                    // i.e. The alert became valid after we last cleared notifications.
                    // This is tricky for recurring types.
                    // Simplified: if lastViewed was recent (e.g. within last hour), maybe we don't show?
                    // Better: If prayerTimeMs > lastViewed (it's a new event in the future we haven't acknowledged)
                    // OR if we missed it and the "missed event" (e.g. prayerTime + 15m) > lastViewed.

                    if (isAlert) {
                        // Estimated "Notification Time"
                        // Upcoming: 60 mins before. Missed: 15 mins after.
                        let notifTime = prayerTimeMs;
                        if (prayerMinutes < currentMinutes) {
                            notifTime = prayerTimeMs + (15 * 60 * 1000); // Triggered at +15m
                        } else {
                            notifTime = prayerTimeMs - (60 * 60 * 1000); // Triggered at -60m
                        }

                        if (notifTime > lastViewed) {
                            count++;
                        }
                    }
                });
            }
            setUnreadCount(count);
        };

        // Subscriptions
        const unsubSchedule = UserService.subscribeToPrayerSchedule(user.uid, (data) => {
            prayerSchedule = data;
            calculateCount();
        });

        const unsubSpaces = SpaceService.subscribeToActiveSpaces((data) => {
            activeSpaces = data;
            calculateCount();
        });

        const unsubNotifs = UserService.subscribeToNotifications(user.uid, (data) => {
            userNotifications = data;
            calculateCount();
        });

        // Trigger calculation when profile updates (timestamp changes)
        calculateCount();

        return () => {
            unsubSchedule();
            unsubSpaces();
            unsubNotifs();
        };
    }, [user, userProfile]);

    return (
        <NotificationContext.Provider value={{ unreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
