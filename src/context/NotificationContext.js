import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
let Notifications = null;
try {
    Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });
    }
} catch (e) {
    console.log('Notifications not available in Expo Go');
}

import Constants from 'expo-constants';
import { auth } from '../services/firebaseConfig';
import { UserService } from '../services/userService';
import { SpaceService } from '../services/SpaceService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [user, setUser] = useState(null);
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    // Initial loading or persisting can be handled here if needed
    // For now, simple in-memory state derived from subscriptions

    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = auth?.onAuthStateChanged ? auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        }) : () => {};

        // Register for push notifications
        registerForPushNotificationsAsync().then(token => {
            if (token) setExpoPushToken(token);
        });

        // Listeners for incoming notifications
        if (Notifications?.addNotificationReceivedListener) {
            notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
                setNotification(notification);
            });
        }

        if (Notifications?.addNotificationResponseReceivedListener) {
            responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
                console.log(response);
            });
        }

        return () => {
            unsubscribeAuth();
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
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

    // Save token when user logs in
    useEffect(() => {
        if (user && expoPushToken) {
            UserService.savePushToken(user.uid, expoPushToken);
        }
    }, [user, expoPushToken]);


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
            // ... existing count logic kept mostly same, but we handle scheduling separately
            if (!user) return;
            let count = 0;
            const lastViewed = userProfile?.lastNotificationViewedAt ? new Date(userProfile.lastNotificationViewedAt).getTime() : 0;

            // 1. Unread User Notifications
            count += userNotifications.filter(n => !n.read).length;

            // 2. Active Spaces (New ones only)
            const newSpaces = activeSpaces.filter(s => {
                const created = s.createdAt?.toDate ? s.createdAt.toDate().getTime() : (s.startedAt || 0);
                return created > lastViewed;
            });
            count += newSpaces.length;

            setUnreadCount(count);
        };

        const schedulePrayers = async (schedules) => {
            // 1. Cancel all existing scheduled notifications
            await Notifications.cancelAllScheduledNotificationsAsync();

            // 2. Check if notifications are enabled
            if (user?.settings?.notifications === false) {
                console.log("Notifications are disabled by user settings.");
                return;
            }

            // 3. Schedule new ones
            schedules.forEach(async (item) => {
                if (!item.time) return;

                const parseTimeComponents = (timeStr) => {
                    const [time, modifier] = timeStr.trim().split(' ');
                    let [hours, minutes] = time.split(':').map(Number);
                    if (modifier) {
                        if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
                        if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
                    }
                    return { hours, minutes };
                };

                const { hours, minutes } = parseTimeComponents(item.time);

                // --- A. EXACT TIME ALERT (The "Alarm") ---
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `It's time for ${item.title || 'Prayer'}`,
                        body: `Time to pray! Tap to mark as done.`,
                        sound: true, // Default sound
                        priority: Notifications.AndroidNotificationPriority.MAX, // High priority
                        vibrate: [0, 500, 200, 500], // Aggressive vibration
                        data: { type: 'prayer', prayerId: item.id, action: 'pray_now' },
                    },
                    trigger: { hour: hours, minute: minutes, repeats: true },
                });

                // --- B. 5 MINUTES BEFORE REMINDER ---
                // Calculate time 5 mins back
                let remindHours = hours;
                let remindMinutes = minutes - 5;
                if (remindMinutes < 0) {
                    remindMinutes += 60;
                    remindHours -= 1;
                    if (remindHours < 0) remindHours += 24;
                }

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `Upcoming: ${item.title || 'Prayer'}`,
                        body: `5 minutes remaining before ${item.title}. Prepare yourself.`,
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.HIGH,
                        data: { type: 'prayer_reminder', prayerId: item.id },
                    },
                    trigger: { hour: remindHours, minute: remindMinutes, repeats: true },
                });
            });

            console.log(`Scheduled ${schedules.length * 2} notifications (exact + reminder)`);
        };


        // Subscriptions
        const unsubSchedule = UserService.subscribeToPrayerSchedule(user.uid, (data) => {
            prayerSchedule = data;
            calculateCount();
            schedulePrayers(data);
        });

        const unsubSpaces = SpaceService.subscribeToActiveSpaces((data) => {
            activeSpaces = data;
            calculateCount();
        });

        const unsubNotifs = UserService.subscribeToNotifications(user.uid, (data) => {
            userNotifications = data;
            calculateCount();
        });

        calculateCount();

        return () => {
            unsubSchedule();
            unsubSpaces();
            unsubNotifs();
        };
    }, [user, userProfile, user?.settings?.notifications]); // Re-run when settings change

    async function registerForPushNotificationsAsync() {
        if (!Notifications || !Notifications.setNotificationChannelAsync) return null;
        if (Constants.appOwnership === 'expo') {
            // Push notifications are removed from Expo Go on Android; prevent warning toast
            return null;
        }
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Bona Alerts',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 500, 250, 500],
                lightColor: '#6366F1',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: true,
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Permission not granted for notifications');
                return null;
            }
            try {
                const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
                token = (await Notifications.getExpoPushTokenAsync({
                    projectId: projectId,
                })).data;
                console.log("Expo Push Token:", token);
            } catch (e) {
                console.error("Error fetching push token:", e);
            }
        }
        return token;
    }

    const value = React.useMemo(() => ({ unreadCount }), [unreadCount]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
