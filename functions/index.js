const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { RtcTokenBuilder, RtcRole } = require("agora-token");

admin.initializeApp();

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
