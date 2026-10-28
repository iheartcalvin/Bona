const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { RtcTokenBuilder, RtcRole } = require("agora-token");
const { Expo } = require('expo-server-sdk');

admin.initializeApp();
const expo = new Expo();

// Use your actual credentials from environment or hardcoded for now (less secure)
// Recommended: firebase functions:config:set agora.app_id="YOUR_APP_ID" agora.app_certificate="YOUR_CERTIFICATE"
const APP_ID = "f030f1e1148e42f384acd498648ae67b";
const APP_CERTIFICATE = "b004de5c63624cc1aad561cc4e449f46";

exports.generateAgoraToken = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const channelName = data.channelName;
    if (!channelName) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with a channelName."
        );
    }

    // uid 0 means let Agora assign a random uid
    const uid = 0;
    const role = data.isPublisher ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    // Token validity time (1 hour)
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    console.log(`Generating token for channel: ${channelName}, role: ${role}`);

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uid,
            role,
            privilegeExpiredTs,
            privilegeExpiredTs
        );

        return { token };
    } catch (e) {
        console.error("Token generation failed:", e);
        throw new functions.https.HttpsError("internal", "Token generation failed.");
    }
});

exports.sendSpaceNotification = functions.firestore
    .document('channels/{channelId}')
    .onCreate(async (snap, context) => {
        const newSpace = snap.data();
        if (!newSpace.isActive) return;

        const hostName = newSpace.hostName || "Someone";
        const title = newSpace.title || "New Live Space";

        // 1. Get all users with pushToken
        // Note: For production, use batched queries or topics.
        const usersSnapshot = await admin.firestore().collection('users').get();

        let messages = [];

        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            // Don't notify the host
            if (doc.id === newSpace.hostId) return;

            if (userData.pushToken && Expo.isExpoPushToken(userData.pushToken)) {
                messages.push({
                    to: userData.pushToken,
                    sound: 'default',
                    title: '🔴 Live Now: ' + hostName,
                    body: title,
                    data: { spaceId: context.params.channelId, type: 'space_invite' },
                });
            }
        });

        // 2. Send notifications in chunks
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];

        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error("Error sending chunks:", error);
            }
        }
    });

/**
 * ClickPesa Webhook Endpoint
 * Host URL: https://us-central1-<project-id>.cloudfunctions.net/clickPesaWebhook
 */
exports.clickPesaWebhook = functions.https.onRequest(async (req, res) => {
    // 1. Validate Method
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const eventData = req.body;
    console.log("Received ClickPesa Webhook:", JSON.stringify(eventData, null, 2));

    // 2. Identify Transaction
    // ClickPesa usually sends 'reference', 'status', 'amount', etc.
    const reference = eventData.reference || eventData.body?.reference;
    const status = eventData.status || eventData.body?.status;

    if (!reference) {
        console.warn("Webhook received without reference");
        // Still return 200 to acknowledge receipt to ClickPesa
        return res.status(200).send('Received');
    }

    try {
        // 3. Update Firestore
        // Assuming we store transactions in a 'transactions' collection
        const transactionRef = admin.firestore().collection('transactions').doc(reference);
        const doc = await transactionRef.get();

        if (doc.exists) {
            await transactionRef.update({
                status: status,
                webhookData: eventData, // Store full payload for debugging
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Transaction ${reference} updated to ${status}`);
        } else {
            // Option: Create it if it doesn't exist (e.g. valid push but local record missing)
            await transactionRef.set({
                status: status,
                webhookData: eventData,
                receivedAt: admin.firestore.FieldValue.serverTimestamp(),
                note: "Created via Webhook"
            });
            console.log(`New Transaction Record created for ${reference}`);
        }

        res.status(200).send('Success');
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).send('Internal Error');
    }
});
