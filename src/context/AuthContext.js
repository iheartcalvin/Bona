import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithCredential,
    sendPasswordResetEmail,
    sendEmailVerification,
    fetchSignInMethodsForEmail
} from 'firebase/auth';
let GoogleSignin = null;
try {
    const googleModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleModule?.GoogleSignin || null;
} catch (e) {
    console.log('GoogleSignin not available in this environment');
}
import { UserService } from '../services/userService';
import { auth } from '../services/firebaseConfig';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        if (GoogleSignin?.configure) {
            try {
                GoogleSignin.configure({
                    webClientId: '995328182020-45mup7qhgd0ouccv0s218t019hps9ugg.apps.googleusercontent.com',
                });
            } catch (err) {
                console.warn('GoogleSignin configure skipped:', err);
            }
        }

        let profileUnsubscribe;

        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                console.log("Auth State Changed: User Logged In", authUser.uid);

                // 1. Check/Create Profile
                try {
                    let existingProfile = null;
                    try {
                        existingProfile = await UserService.getUserProfile(authUser.uid);
                        console.log("Profile Check Result:", existingProfile ? "Found" : "Not Found");
                    } catch (fetchErr) {
                        console.error("Profile check failed (permissions?):", fetchErr);
                        // If fetch fails, we might still try to create, or assume it's missing.
                        // For now, let's treat error as 'null' and try to create, 
                        // as permission errors on READ don't imply WRITE is blocked.
                        existingProfile = null;
                    }

                    if (!existingProfile) {
                        console.log("Creating new profile for:", authUser.uid);
                        try {
                            await UserService.createUserProfile(authUser.uid, {
                                email: authUser.email,
                                firstName: authUser.displayName?.split(' ')[0] || 'User',
                                lastName: authUser.displayName?.split(' ').slice(1).join(' ') || '',
                                // username: null, // intentionally left undefined so RootNavigator forces setup
                                phone: authUser.phoneNumber || '',
                                photoURL: authUser.photoURL
                            });
                            console.log("✅ Profile created successfully!");
                        } catch (createErr) {
                            console.error("❌ Failed to create user profile:", createErr);
                        }
                    } else if (existingProfile.email === 'generated@user.com' || !existingProfile.username) {
                        // HEAL: If profile exists but is a placeholder (created by prayer completion), update it!
                        console.log("⚠️ Found placeholder profile! Upgrading with real data...");
                        try {
                            await UserService.updateUserProfile(authUser.uid, {
                                email: authUser.email,
                                firstName: authUser.displayName?.split(' ')[0] || 'User',
                                lastName: authUser.displayName?.split(' ').slice(1).join(' ') || '',
                                username: authUser.displayName?.replace(/\s/g, '').toLowerCase() || 'user' + Math.floor(Math.random() * 1000),
                                photoURL: authUser.photoURL
                            });
                            console.log("✅ Profile UPGRADED successfully!");
                        } catch (healErr) {
                            console.error("❌ Failed to upgrade profile:", healErr);
                        }
                    }
                } catch (err) {
                    console.error("Unexpected error in profile sync:", err);
                }

                // 2. Subscribe to Firestore profile
                profileUnsubscribe = UserService.subscribeToUserProfile(authUser.uid, (profileData) => {
                    const mergedUser = {
                        ...authUser,
                        ...profileData, // Merge Firestore data
                        email: authUser.email || profileData?.email, // Prefer Auth email
                        displayName: profileData?.username || authUser.displayName, // Prefer Firestore username
                        emailVerified: authUser.emailVerified,
                    };
                    setUser(mergedUser);
                    if (initializing) setInitializing(false);
                    setLoading(false);
                });
            } else {
                // User is signed out
                setUser(null);
                if (profileUnsubscribe) profileUnsubscribe();
                if (initializing) setInitializing(false);
                setLoading(false);
            }
        });

        return () => {
            unsubscribe();
            if (profileUnsubscribe) profileUnsubscribe();
        };
    }, []);

    const signIn = async (email, password) => {
        setLoading(true);
        try {
            return await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const signUp = async (email, password) => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            return userCredential;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const resendVerification = async () => {
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
        }
    };

    const signInWithGoogle = async () => {
        if (!GoogleSignin) {
            throw new Error('Google Sign-In is only available in standalone builds.');
        }
        setLoading(true);
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            console.log('Google Sign-In User Info:', JSON.stringify(userInfo, null, 2));
            const idToken = userInfo.data?.idToken || userInfo.idToken;
            if (!idToken) throw new Error('No ID Token found');
            const googleCredential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, googleCredential);
            // Profile creation is now handled automatically by onAuthStateChanged
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const checkEmailExists = async (email) => {
        try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            return methods.length > 0;
        } catch (error) {
            console.error('Error checking email existence:', error);
            // In case of link enumeration protection, we might need a different approach
            // but for now this is the standard way.
            return false;
        }
    };

    const resetPassword = async (email) => {
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            setLoading(false);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const reloadUser = async () => {
        if (auth.currentUser) {
            await auth.currentUser.reload();
            // Manually update the verified status in our local merged state
            setUser(prev => ({
                ...prev,
                emailVerified: auth.currentUser.emailVerified
            }));
            return auth.currentUser;
        }
    };

    if (initializing) return null;

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                signIn,
                signUp,
                signInWithGoogle,
                signOut,
                resetPassword,
                resendVerification,
                checkEmailExists,
                reloadUser,
            }}
        >
            {console.log('AuthContext Value:', { user: !!user, emailVerified: user?.emailVerified, hasSignInWithGoogle: !!signInWithGoogle })}
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

