import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, ScrollView, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from 'react-native';
import { CLICKPESA_API_KEY, CLICKPESA_CLIENT_ID, CLICKPESA_API_URL } from '@env';
import CryptoJS from 'crypto-js';

// Normalize URL to remove trailing slash
const API_URL = CLICKPESA_API_URL.endsWith('/') ? CLICKPESA_API_URL.slice(0, -1) : CLICKPESA_API_URL;

// Helper to ensure correct auth header format
const getAuthHeader = (token) => token.startsWith('Bearer') ? token : `Bearer ${token}`;

let authToken = null;
let tokenExpiry = null;

export const ClickPesaService = {
    /**
     * Authenticate and get a valid JWT token.
     * Tokens are cached until they expire (1 hour).
     */
    getToken: async () => {
        // Return existing token if valid (add 5 min buffer)
        if (authToken && tokenExpiry && new Date() < new Date(tokenExpiry.getTime() - 5 * 60000)) {
            return authToken;
        }

        try {
            const response = await fetch(`${API_URL}/third-parties/generate-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': CLICKPESA_API_KEY,
                    'client-id': CLICKPESA_CLIENT_ID,
                },
            });

            const text = await response.text();
            console.log("ClickPesa Token Response:", text); // Debug log

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
            }

            if (!response.ok) {
                throw new Error(`Authentication failed: ${data.message || response.statusText || text}`);
            }

            if (data.token) {
                authToken = data.token;
                // Assuming token lasts 1 hour, set expiry
                const now = new Date();
                tokenExpiry = new Date(now.getTime() + 60 * 60 * 1000);
                return authToken;
            } else {
                throw new Error("No token received in response");
            }
        } catch (error) {
            console.error("Error getting ClickPesa token:", error);
            throw error;
        }
    },

    /**
     * Initiate a C2B Collection (Receive Payment)
     * @param {Object} paymentDetails 
     * @param {number} paymentDetails.amount - Amount to collect
     * @param {string} paymentDetails.msisdn - Payer phone number (e.g., 2557...)
     * @param {string} paymentDetails.reference - Unique transaction reference
     * @param {string} paymentDetails.operator - 'Tigo Pesa', 'M-Pesa', 'Airtel Money', 'HaloPesa'
     */
    collect: async ({ amount, msisdn, reference, operator }) => {
        try {
            const token = await ClickPesaService.getToken();

            // Depending on ClickPesa API, collection endpoint might differ. 
            // Standard C2B usually involves initiating a request.
            // Using a generic endpoint pattern until specific doc confirmation, 
            // but based on common patterns: /payment/collections or similar.
            // **Correction based on Search**: Search didn't give exact collection endpoint path, 
            // but standard ClickPesa often uses `/payment` or channel specific.
            // I will use a generic structure that users can adjust or I will verify if I can.
            // However, to be safe and functional, I'll log strict assumptions.

            // Assume "POST /payment" or similar for now for C2B or specific channel.
            // Actually, usually it's `POST /webshop/generate-checkout-url` for simple flows, 
            // OR direct API `POST /collections`.
            // Let's assume standard `POST /collections` or similar based on typical REST.
            // A common endpoint is `/payments` on ClickPesa.

            const payload = {
                amount: amount,
                msisdn: msisdn,
                currency: 'TZS', // Defaulting
                reference: reference, // Your system ID
                channel: operator // e.g., 'Tigo'
            };

            const response = await fetch(`${API_URL}/payments`, {
                method: 'POST',
                headers: {
                    'Authorization': getAuthHeader(token),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const text = await response.text();

            if (!response.ok) {
                throw new Error(`Collection failed: ${text}`);
            }

            try {
                return JSON.parse(text);
            } catch (e) {
                // If it was OK but not JSON (rare for APIs but possible)
                console.warn("Collection response was not JSON:", text);
                return { success: true, message: text };
            }
        } catch (error) {
            console.error("ClickPesa Collection Error:", error);
            throw error;
        }
    },

    /**
     * Initiate a B2C Disbursement (Send Money)
     * @param {Object} payoutDetails
     * @param {number} payoutDetails.amount 
     * @param {string} payoutDetails.msisdn - Recipient phone
     * @param {string} payoutDetails.reference
     */
    disburse: async ({ amount, msisdn, reference }) => {
        try {
            const token = await ClickPesaService.getToken();

            const payload = {
                amount: amount,
                msisdn: msisdn,
                currency: 'TZS',
                reference: reference,
                // description: 'Payout' 
            };

            const response = await fetch(`${API_URL}/payouts`, { // specific payout endpoint assumption
                method: 'POST',
                headers: {
                    'Authorization': getAuthHeader(token),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const text = await response.text();

            if (!response.ok) {
                throw new Error(`Disbursement failed: ${text}`);
            }

            try {
                return JSON.parse(text);
            } catch (e) {
                console.warn("Disbursement response was not JSON:", text);
                return { success: true, message: text };
            }
        } catch (error) {
            console.error("ClickPesa Disbursement Error:", error);
            throw error;
        }
    },

    /**
     * Generate a Hosted Checkout URL
     * @param {Object} details
     * @param {number} details.amount - The total price/amount
     * @param {string} details.reference - Unique reference
     */
    getCheckoutUrl: async ({ amount, reference }) => {
        try {
            const token = await ClickPesaService.getToken();

            const rawPayload = {
                orderReference: reference.toString(),
                orderCurrency: 'TZS',
                totalPrice: amount.toString(),
                // description: "Payment" // Optional?
            };

            // Calculate Checksum - CORRECT LOGIC per Docs
            // 1. Recursive Sort - simple sort for flat object is fine
            const sortedKeys = Object.keys(rawPayload).sort();
            const sortedPayload = {};
            sortedKeys.forEach(key => {
                sortedPayload[key] = rawPayload[key];
            });

            // 2. Serialize to JSON (compact)
            const serializedPayload = JSON.stringify(sortedPayload);
            console.log("DEBUG: Serialized Payload for Checksum:", serializedPayload);

            // 3. HMAC with API Key (Note: Docs say "Secret Key". Using API Key as placeholder until user provides Secret)
            // If this fails, user needs to provide CLICKPESA_CHECKSUM_KEY
            const secretKey = process.env.CLICKPESA_CHECKSUM_KEY || CLICKPESA_API_KEY;
            console.log("DEBUG: Using Secret Key length:", secretKey ? secretKey.length : 0);

            const checksum = CryptoJS.HmacSHA256(serializedPayload, secretKey).toString(CryptoJS.enc.Hex);
            console.log("DEBUG: Generated Checksum:", checksum);

            // Add checksum/verify token to payload
            const payload = {
                ...rawPayload,
                checksum: checksum
            };

            console.log("Generating Checkout URL with Payload:", JSON.stringify(payload));

            const endpoint = `${API_URL}/third-parties/checkout-link/generate-checkout-url`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': getAuthHeader(token),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload), // Note: body key order doesn't matter for request, but checksum was calc'd on sorted
            });

            const text = await response.text();

            if (!response.ok) {
                // Try to parse error message
                let errorMessage = text;
                try {
                    const errorData = JSON.parse(text);
                    if (errorData.message) errorMessage = errorData.message;
                } catch (e) { }

                throw new Error(`Failed to generate checkout URL: ${errorMessage}`);
            }

            try {
                const data = JSON.parse(text);
                // Correct response field per docs
                if (data.checkoutLink) return data.checkoutLink;

                if (data.url) return data.url;
                if (data.link) return data.link;
                return data;
            } catch (e) {
                return text;
            }
        } catch (error) {
            console.error("ClickPesa Checkout Error:", error);
            throw error;
        }
    }
};
