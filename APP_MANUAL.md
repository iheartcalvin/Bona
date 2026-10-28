# Beloved App Manual

## 1. Executive Summary

Beloved is a mobile spiritual fellowship application built with React Native, Expo, Firebase, Groq AI, Agora, Expo Notifications, and ClickPesa. Its central idea is to help users build a consistent spiritual life through Bible reading, guided prayer, prayer scheduling, community spaces, charitable giving, personal profiles, and AI-supported encouragement.

The app is designed for people who want faith-centered companionship on their phone: a place to read scripture, generate short prayers, join live Bible study spaces, receive reminders, follow other believers, support causes, and track personal spiritual habits.

At a high level, Beloved does five things:

1. Helps users read and engage with the Bible.
2. Helps users pray through AI-generated prayers, schedules, reminders, and completion history.
3. Connects users through profiles, follows, friend requests, notifications, and live group spaces.
4. Supports charitable events and developer support through donation/payment flows.
5. Gives the developer a foundation for a faith community platform that can grow into subscriptions, donations, live events, creator tools, ministry partnerships, and analytics.

## 2. App Identity

**App name:** Beloved

**Package/bundle identity:** `com.faithtech.beloved`

**Current version:** `1.0.0`

**Primary platform:** iOS and Android through Expo/React Native.

**Core theme:** Spiritual fellowship, prayer, Bible reading, emotional encouragement, and community.

**Target users:**

- Christians looking for daily prayer and scripture support.
- Small groups that want quick live Bible study spaces.
- Churches, ministries, or youth communities that want a lightweight fellowship app.
- Donors who want to support charity events or the app’s development.
- Developers/founders building a faith-based social platform.

## 3. What The App Does

Beloved is not just a Bible reader. It combines personal devotion, AI guidance, live community, and giving.

### 3.1 Personal Spiritual Practice

Users can:

- Read Bible chapters.
- Listen to scripture through text-to-speech.
- Select, copy, highlight, and share verses.
- Track Bible reading progress.
- View a Word of the Day.
- Generate short prayers using AI.
- Schedule prayers at specific times.
- Receive prayer notifications.
- Mark prayers as completed.
- View prayer history and analytics.

### 3.2 Community Fellowship

Users can:

- Create a live space for Bible study or fellowship.
- Join active spaces hosted by others.
- See who is in a space.
- Participate as a host, speaker, or listener.
- Raise a hand, mute/unmute, and react.
- Follow users and accept/reject friend requests.
- View user profiles and community counts.
- Receive notifications about spaces, friend requests, and prayer activity.

### 3.3 AI Companion And Prayer Assistant

The app uses Groq’s OpenAI-compatible chat completion endpoint with the `llama-3.1-8b-instant` model.

AI currently supports:

- Generating prayers by category or situation.
- Generating a Word of the Day.
- Responding in the chat/therapy companion experience with short, spiritually grounded encouragement.

Important product note: the companion should be positioned as spiritual encouragement, reflection, and prayer support. It should not be marketed as a replacement for licensed therapy, medical advice, pastoral counseling, or emergency support.

### 3.4 Giving And Events

The Events screen is called “Act of Love.” It shows:

- Charity events from Firestore.
- Donation goals and progress.
- Sponsor cards.
- A developer support card.
- Payment entry through a Payment screen.
- ClickPesa checkout-link generation for hosted payments.

This creates a pathway for charity campaigns, ministry giving, sponsorships, and support for the engineering team.

### 3.5 Account, Identity, And Safety Gates

Users can:

- Sign up with email/password.
- Sign in with email or username.
- Sign in with Google.
- Reset password.
- Verify email.
- Choose a username.
- Edit profile details and avatar.
- Set mood.
- Manage theme/settings.

The root navigation blocks access in these cases:

- First launch users see onboarding.
- Unauthenticated users see login/signup.
- Banned users see the banned screen.
- Users without a username must complete username setup.
- Users with unverified email must verify before entering the main app.

## 4. Main User Journey

### 4.1 First Launch

The app starts with a custom splash screen and then checks whether onboarding has been completed in AsyncStorage.

If onboarding has not been completed, the user sees onboarding slides. After onboarding, they are sent to authentication.

### 4.2 Authentication

Users can sign up with email and password or use Google sign-in. On email signup, Firebase sends an email verification message.

The app creates or repairs a Firestore user profile after Firebase Auth detects a logged-in user. If a Google sign-in user has no username, the app forces them to choose one.

### 4.3 Verification And Access

After signup, the user must verify email. The app provides a verification pending screen where the user can check status, resend verification, or sign out.

### 4.4 Main App

After account checks pass, users enter the bottom-tab app:

- Bible
- Prayer
- Spaces
- Events
- Profile

Additional stack screens include:

- Edit Profile
- Notifications
- Chat
- Help
- Legal
- Payment

## 5. Feature Manual

## 5.1 Onboarding

**Purpose:** Introduce the app’s emotional and spiritual value before signup.

**Implementation:** `src/screens/OnboardingScreen.js`

**Storage:** `AsyncStorage` key `onboardingCompleted`.

**User flow:**

1. User opens the app for the first time.
2. The app shows onboarding screens.
3. User taps next/skip.
4. App stores onboarding completion locally.
5. User proceeds to login/signup.

## 5.2 Authentication

**Purpose:** Secure the app and create a verified identity for community features.

**Implementation:**

- `src/context/AuthContext.js`
- `src/screens/LoginScreen.js`
- `src/screens/AuthScreen.js`
- `src/screens/UsernameSetupScreen.js`
- `src/screens/VerificationPendingScreen.js`

**Services used:**

- Firebase Auth
- Google Sign-In
- Firestore user profiles through `UserService`

**Main capabilities:**

- Email/password signup.
- Email/password login.
- Username login lookup.
- Google sign-in.
- Email verification.
- Password reset.
- Username availability checks.
- Profile auto-creation after auth state changes.

**Important behavior:**

- The app merges Firebase Auth user data with Firestore profile data.
- Firestore username is preferred for `displayName`.
- If profile data is missing, the app creates a basic profile.
- If profile data is incomplete, the app attempts to repair it.

## 5.3 Bible

**Purpose:** Give users a Bible reading, study, audio, highlight, and sharing experience.

**Implementation:** `src/screens/BibleScreen.js`

**Supporting files:**

- `src/services/bibleService.js`
- `src/services/SpeechService.js`
- `src/services/userService.js`
- `src/data/bibleStructure.js`
- `src/components/Bible/BibleTopicSelector.js`

**Main capabilities:**

- Select book and chapter.
- Filter by Old Testament/New Testament/all books.
- Search books.
- Fetch chapter text from `bible-api.com`.
- Select one or more verses.
- Copy selected verses.
- Highlight verses.
- Subscribe to saved user highlights.
- Use text-to-speech for scripture.
- Adjust font size and speech volume.
- Track reading history and progress.
- Show reading completion and quiz-style engagement.
- Share selected scripture visually through view capture.
- Broadcast reading progress into a live space when joined through a channel context.

**How it works:**

The Bible screen stores current book, chapter, selected verses, highlights, speech state, and reader UI state locally. It fetches scripture through `BibleService`, which caches chapter and verse responses in memory. User-specific progress and highlights are saved in Firestore through `UserService`.

## 5.4 Prayer

**Purpose:** Help users pray consistently and personally.

**Implementation:**

- `src/screens/PrayerScreen.js`
- `src/screens/ScheduledPrayersScreen.js`
- `src/screens/PrayerAnalyticsScreen.js`
- `src/components/AddPrayerModal.js`
- `src/services/WordOfDayService.js`
- `src/services/aiService.js`

**Main capabilities:**

- Display Word of the Day.
- Generate AI prayer by category.
- Save generated prayer into prayer history.
- Schedule custom prayers.
- View upcoming prayer.
- Mark prayer sessions complete.
- View missed prayers.
- View prayer history.
- View analytics such as streak, weekly activity, and badges.
- Share Word of the Day as an image.

**How AI prayer works:**

The app calls Groq’s chat completion API and asks for a short Christian prayer around a topic such as Healing, Wisdom, Strength, or Gratitude. If the API key is missing or the call fails, the app returns a fallback prayer.

**How scheduling works:**

Scheduled prayers are stored under each user in Firestore. The notification context listens to that schedule and creates two local notifications for each prayer:

- One at the exact prayer time.
- One five minutes before the prayer time.

**How completion works:**

When a user marks prayer complete, `UserService.markPrayerComplete` writes to prayer history and updates user stats.

## 5.5 Prayer Analytics

**Purpose:** Encourage consistency by showing prayer history and achievement.

**Implementation:** `src/screens/PrayerAnalyticsScreen.js`

**Main capabilities:**

- Loads recent prayer history.
- Calculates completion totals.
- Calculates streak-like status.
- Shows weekly activity.
- Displays badge-style achievements.

**Community/product value:**

Analytics give users a sense of growth. This can turn prayer from a one-time action into a habit.

## 5.6 Spaces

**Purpose:** Let users gather in live Bible study or fellowship spaces.

**Implementation:**

- `src/screens/SpacesScreen.js`
- `src/components/Bible/SpaceStudy.js`
- `src/services/SpaceService.js`
- `src/services/AgoraService.js`
- Firebase Function `generateAgoraToken`

**Main capabilities:**

- View active spaces.
- Create a new space with name, topic, description, and agenda.
- Pick a scripture/topic focus.
- Join a space.
- Host a space.
- Track participants.
- Assign roles: host, speaker, listener.
- Raise hand.
- Promote/demote speakers.
- Mute/unmute.
- Send reactions.
- Broadcast Bible reading progress.
- Auto-expire spaces after roughly 40 minutes.
- Clean stale or empty spaces.

**How it works:**

When a user creates a space, the app creates a Firestore `channels` document and a `participants` subdocument for the host. The space is marked active and given an expiry timestamp.

When a user joins, they are added to the participants subcollection and the participant count increments. If the host leaves, the space is ended. If a non-host leaves, the participant count decrements.

Agora is prepared as the real-time audio layer. The Firebase Cloud Function generates Agora tokens for authenticated users.

## 5.7 Notifications

**Purpose:** Keep users aware of prayer times, active spaces, friend requests, and account activity.

**Implementation:**

- `src/context/NotificationContext.js`
- `src/screens/NotificationsScreen.js`
- `src/components/NotificationBell.js`
- `src/components/NotificationBadge.js`
- Firebase Function `sendSpaceNotification`

**Main capabilities:**

- Register device for Expo push notifications.
- Store Expo push token on user profile.
- Show unread count.
- Show scheduled prayer reminders.
- Show active space notifications.
- Show Firestore user notifications.
- Accept/reject friend requests.
- Clear notifications.
- Mark notifications read.

**How push notification works:**

When a new Firestore channel is created, the `sendSpaceNotification` Cloud Function collects user push tokens and sends Expo push notifications to users other than the host.

**How local prayer reminders work:**

The client schedules repeating notifications for prayer schedule items.

## 5.8 Chat / Companion

**Purpose:** Provide a private spiritual support chat experience.

**Implementation:**

- `src/screens/ChatScreen.js`
- `src/screens/TherapyScreen.js`
- `src/services/ChatService.js`
- `src/services/aiService.js`

**Main capabilities:**

- Create or reuse latest chat session.
- Store messages under the current user.
- Send user message.
- Call AI for a response.
- Save AI response.
- Include context such as user name, mood, recent scripture, and recent message history.

**Product positioning:**

This should be described as “Beloved Companion” or “spiritual encouragement chat.” Avoid presenting it as professional therapy. Add clear disclaimers and escalation guidance for serious emotional, medical, or emergency situations.

## 5.9 Events, Charity, Sponsors, And Donations

**Purpose:** Turn community attention into action and support.

**Implementation:**

- `src/screens/EventsScreen.js`
- `src/screens/PaymentScreen.js`
- `src/services/ClickPesaService.js`
- Firebase Function `clickPesaWebhook`

**Firestore data used:**

- `system/config`
- `events`
- `sponsors`
- `transactions`

**Main capabilities:**

- Show charity events.
- Show event images, description, location, time, raised amount, goal amount.
- Show progress bars.
- Show sponsors.
- Show developer support card.
- Copy manual payment information.
- Navigate to hosted payment checkout.
- Generate ClickPesa checkout URL.
- Handle payment status updates through webhook.

**How ClickPesa checkout works:**

The app obtains a ClickPesa token, prepares a checkout payload, calculates a checksum, requests a hosted checkout URL, and opens that URL through device linking.

**Important production note:**

Payment secrets and checksum generation should ideally live on a secure backend, not inside the mobile client. The current implementation imports ClickPesa credentials from environment variables in the app code, which can be exposed in a built mobile app.

## 5.10 Profile And Social Features

**Purpose:** Make users visible as community members and allow lightweight social connection.

**Implementation:**

- `src/screens/ProfileScreen.js`
- `src/screens/EditProfileScreen.js`
- `src/components/UserProfileModal.js`
- `src/components/UserListModal.js`
- `src/components/SettingsModal.js`
- `src/services/userService.js`

**Main capabilities:**

- View profile.
- Edit full name, username, bio, and avatar.
- Upload profile image to Firebase Storage.
- Set mood.
- See rewards/badges.
- View followers/following counts.
- Send, accept, reject, or cancel friend requests.
- Follow/unfollow users.
- Open follower/following lists.
- Toggle theme/settings.
- Reset password.
- Sign out.

**How profile images work:**

The app asks for media library permission, lets the user pick an image, compresses it, uploads it to Firebase Storage under `profile_images/{userId}`, then stores the download URL on the user profile.

## 5.11 Help And Legal

**Purpose:** Provide basic support and legal information.

**Implementation:**

- `src/screens/HelpScreen.js`
- `src/screens/LegalScreen.js`
- `src/screens/BannedScreen.js`

**Help screen:**

Loads support contact details from `system/config`, displays FAQ items, and can open email or phone support.

**Legal screen:**

Displays Terms and Privacy tabs from local text.

**Banned screen:**

Shows suspension information, lets the user contact support, submit an appeal, or sign out.

## 6. Technical Architecture

## 6.1 Frontend

**Framework:** React Native with Expo.

**Navigation:**

- `RootNavigator` controls auth/onboarding/banned/verification gates.
- `MainTabNavigator` controls the main app tabs.
- Prayer has its own stack navigator.

**State management:**

- React Context for auth, notification count, and theme.
- Screen-level state with React hooks.
- Firestore realtime listeners for live data.

**Theme:**

- `ThemeContext` supports system, light, and dark preference.
- Colors are defined in `src/theme/colors.js`.

## 6.2 Backend

**Firebase services used:**

- Firebase Auth for accounts.
- Firestore for app data.
- Firebase Storage for profile images.
- Firebase Cloud Functions for Agora token generation, push notifications, and ClickPesa webhook.

## 6.3 External Services

**Groq AI**

- Prayer generation.
- Word of the Day.
- Companion chat.

**Bible API**

- Fetches KJV chapter and verse data.

**Unreal Speech**

- Premium text-to-speech in `SpeechService`.

**Agora**

- Intended for real-time live audio spaces.

**Expo Notifications**

- Local prayer reminders.
- Device push tokens.
- Push notification handling.

**ClickPesa**

- Hosted checkout links.
- Payment webhook status updates.

## 7. Data Model Overview

The app uses Firestore collections and subcollections. Based on the code, the major structures are:

### 7.1 `users/{uid}`

Likely fields:

- email
- firstName
- lastName
- username
- username_lowercase
- phone/phoneNumber
- photoURL
- bio
- mood
- settings
- pushToken
- stats
- isBanned
- lastNotificationViewedAt
- createdAt
- updatedAt

Subcollections:

- `prayerSchedule`
- `prayerHistory`
- `notifications`
- `chat_sessions`
- `followers`
- `following`
- `requests`
- likely rewards/highlights depending on the rest of `UserService`

### 7.2 `channels/{channelId}`

Fields:

- name
- topic
- description
- agenda
- hostId
- hostName
- hostAvatar
- isActive
- participantsCount
- createdAt
- expiresAt
- endedAt
- readingSync

Subcollections:

- `participants`
- `reactions`

### 7.3 `events/{eventId}`

Fields shown by UI:

- title
- description
- image
- raised
- goal
- location
- time
- createdAt

### 7.4 `sponsors/{sponsorId}`

Fields shown by UI:

- name
- logo
- description/details depending on modal support
- createdAt

### 7.5 `system/config`

Used for:

- Admin/support email.
- Phone number.
- Donation/payment display configuration.
- Developer support card title, description, image, and progress visibility.

### 7.6 `transactions/{reference}`

Used by the ClickPesa webhook to store:

- status
- webhookData
- receivedAt/updatedAt
- note

### 7.7 `daily_wod/{dateId}`

Used by Word of the Day:

- text
- ref
- book
- chapter
- generatedAt

## 8. How The App Works Internally

## 8.1 Startup Flow

1. `App.js` prevents the native splash from hiding immediately.
2. App waits briefly, hides native splash, and shows the custom splash.
3. Providers wrap the app:
   - `ThemeProvider`
   - `AuthProvider`
   - `NotificationProvider`
4. `NavigationContainer` receives light/dark theme values.
5. `RootNavigator` decides which screen stack the user should see.

## 8.2 Auth Flow

1. Firebase Auth reports auth state.
2. `AuthContext` checks Firestore profile.
3. Missing profile is created.
4. Profile listener merges Firestore data with Firebase Auth data.
5. Root navigation gates user based on ban, username, and verification.

## 8.3 Realtime Flow

The app relies heavily on Firestore `onSnapshot` listeners. This gives realtime updates for:

- User profile changes.
- Prayer schedules.
- Prayer history.
- Notifications.
- Active spaces.
- Space participants.
- Space reactions.
- Events.
- Sponsors.
- System config.

## 8.4 Notification Flow

1. App requests notification permission.
2. Expo push token is saved to the user profile.
3. Prayer schedule listener creates local repeating notifications.
4. New live spaces trigger a Cloud Function.
5. Cloud Function sends Expo push notifications to users with push tokens.
6. Client combines unread Firestore notifications and new spaces into an unread count.

## 8.5 AI Flow

1. Screen sends user intent to `AIService`.
2. `AIService` builds a system prompt.
3. It calls Groq chat completions.
4. It returns the assistant text or fallback text.
5. Screen saves or displays the output.

## 8.6 Payment Flow

1. User selects an event or developer support option.
2. App navigates to `PaymentScreen`.
3. User enters amount unless the amount is fixed.
4. `ClickPesaService` authenticates and generates a checkout link.
5. App opens the hosted checkout URL.
6. ClickPesa webhook updates `transactions/{reference}`.

## 9. Community Impact

Beloved can impact a community in several meaningful ways.

### 9.1 Spiritual Consistency

Prayer reminders, Word of the Day, Bible reading progress, and analytics help users build repeated devotional habits. This is valuable because spiritual growth often depends less on one big moment and more on small daily rhythms.

### 9.2 Fellowship Beyond Physical Location

Live spaces allow people to gather quickly even when they are not in the same church, school, neighborhood, or country. This can help small groups, diaspora communities, youth ministries, and remote believers stay connected.

### 9.3 Emotional Encouragement

The AI companion and prayer generation features offer immediate encouragement. Used responsibly, they can help users reflect, pray, and feel less alone between real human conversations.

### 9.4 Charity And Mutual Aid

The Events and donations area can turn attention into action. Churches, ministries, and community groups could run campaigns for food support, school fees, medical help, disaster relief, youth programs, or local outreach.

### 9.5 Youth And Small Group Engagement

The app’s lightweight format fits modern mobile habits. Bible reading, scheduled prayer, live spaces, and shareable verses can make faith practice feel more interactive and socially supported.

### 9.6 Data-Informed Ministry

With proper privacy protections, aggregated insights can help leaders understand engagement patterns, popular prayer needs, common study topics, donation campaign performance, and community participation.

## 10. What Is In It For The Developer

Beloved has several developer and founder opportunities.

### 10.1 Product Ownership

The developer owns a full-stack mobile platform with authentication, realtime data, AI, audio spaces, payments, notifications, and social features. This is a strong foundation for a serious product.

### 10.2 Monetization Possibilities

Potential revenue paths include:

- Optional premium subscription for advanced AI prayer, audio Bible voices, analytics, and saved studies.
- Ministry/church dashboards.
- Event campaign fees.
- Sponsored charity campaigns.
- Donations to support app development.
- Premium live space tools.
- Creator/ministry accounts.
- Bible study packs or guided devotion plans.

### 10.3 Portfolio Value

Technically, this app demonstrates:

- React Native/Expo engineering.
- Firebase architecture.
- Real-time listeners.
- Cloud Functions.
- AI integration.
- Payment integration.
- Push notification handling.
- Social and community product thinking.

This can be presented to investors, ministries, employers, partners, or app store reviewers as a full product, not a simple demo.

### 10.4 Platform Expansion

The architecture can grow into:

- Admin dashboard.
- Church dashboard.
- Public web landing page.
- Creator tools.
- Moderation console.
- Analytics dashboard.
- Multi-language international product.
- Ministry marketplace.

## 11. Future Possibilities

## 11.1 Product Roadmap

High-value future features:

- Daily devotional plans.
- Group reading plans.
- Church/ministry pages.
- Private groups.
- Prayer request wall.
- Prayer chains.
- Moderated public posts.
- Live event scheduling.
- Sermon notes.
- In-app Bible study guides.
- Scripture memory tools.
- Testimony sharing.
- Mentorship matching.
- Volunteer campaign management.
- Multi-language Bible support.
- Offline Bible reading.
- In-app audio rooms with stronger moderation.
- Paid premium plans.
- Admin analytics dashboard.

## 11.2 AI Roadmap

Possible AI features:

- Personalized devotional plans.
- Prayer request summarization.
- Bible Q&A with source references.
- Sermon/study outline generation.
- Mood-aware scripture suggestions.
- Group study discussion questions.
- Safety-aware companion responses.
- Pastoral/admin summaries for opt-in groups.

## 11.3 Community Roadmap

Possible community features:

- Verified church accounts.
- Group leaders and moderators.
- Space scheduling.
- Event RSVPs.
- Local community chapters.
- Youth ministry mode.
- Anonymous prayer requests with moderation.
- Report/block tools.
- Trusted contacts for support.

## 11.4 Giving Roadmap

Possible giving features:

- Recurring donations.
- Campaign pages.
- Donor receipts.
- Transparent fund progress.
- Sponsor tiers.
- Charity verification.
- In-app impact updates.
- Campaign sharing links.

## 12. Admin And Moderation Needs

The README mentions a separate Beloved Admin dashboard. Based on the app features, the admin platform should support:

- User search.
- Ban/unban users.
- View ban appeals.
- Manage events.
- Manage sponsors.
- Manage system config.
- Manage donation settings.
- View transaction status.
- Review reported content.
- Moderate live spaces.
- View community statistics.
- Send announcements.
- Manage support contact details.

Moderation is especially important because the app includes live spaces, profiles, social connections, AI chat, and donations.

## 13. Security And Production Readiness Notes

These are important before a public launch.

### 13.1 Firestore Rules Are Too Broad

Current Firestore rules allow any authenticated user to read and write all Firestore data:

```js
allow read, write: if request.auth != null;
```

This is not safe for production. It means any logged-in user could potentially read or modify other users’ data, events, channels, transactions, or system configuration.

Recommended fix:

- Users can read/write only their own private data.
- Public profiles expose only safe public fields.
- Events and sponsors are readable by all authenticated users but writable only by admins.
- Transactions are writable only by backend/webhook.
- System config is writable only by admins.
- Channels have role-based permissions.
- Banned users should be blocked in rules, not only in UI.

### 13.2 Secrets In Client Code

AI keys, ClickPesa keys, checksum keys, Agora credentials, and similar secrets should not be shipped inside the mobile app. Mobile apps can be reverse engineered.

Recommended fix:

- Move payment creation to Cloud Functions.
- Move AI calls to a backend proxy if abuse control is needed.
- Store Agora credentials in Firebase Functions config or secret manager.
- Remove hardcoded app certificate values.

### 13.3 AI Safety

The AI companion needs stronger safety boundaries:

- Clear disclaimer that it is not professional therapy.
- Crisis guidance that directs users to trusted adults, emergency services, or local support when needed.
- Avoid overclaiming spiritual or mental health authority.
- Add server-side or prompt-level safety handling.
- Consider age-aware policies if teens can use the app.

### 13.4 Payment Safety

Payment systems need:

- Server-side checkout creation.
- Signed webhook verification.
- Transaction records created before checkout.
- Idempotent webhook handling.
- Clear donation terms.
- Refund policy.
- Campaign transparency.

### 13.5 Live Space Safety

Live spaces need:

- Report user.
- Block user.
- Moderator controls.
- Space removal.
- Rate limiting.
- Participant caps.
- Host transfer or auto-moderation.
- Clear rules for acceptable behavior.

### 13.6 Data Privacy

The app stores sensitive personal and spiritual data, including prayer history, mood, profile information, and chat messages.

Recommended additions:

- Privacy policy written for the actual data model.
- Data deletion request flow.
- Export data flow.
- Clear retention policy.
- Consent around analytics and AI processing.

## 14. Known Gaps And Technical Observations

The app has a strong concept, but several areas need attention:

- Firestore security rules must be replaced before production.
- ClickPesa secret handling should move backend-side.
- Agora credentials are currently hardcoded in Cloud Functions.
- AI service is called from the client, which can expose API usage to abuse.
- Some screens duplicate companion chat behavior (`ChatScreen` and `TherapyScreen`).
- Some notification count logic in `PrayerScreen` references variables that are not defined in that screen, which may produce runtime errors if called.
- App store readiness needs stronger legal, privacy, moderation, and safety wording.
- There is a large `build/` directory in the repo, which usually should not be committed unless intentionally needed.
- The admin dashboard is mentioned but not included in this repository.

## 15. Launch Checklist

Before public release:

1. Replace Firestore rules with least-privilege rules.
2. Move sensitive payment and AI calls to Cloud Functions where appropriate.
3. Store Agora secrets securely.
4. Add admin-only custom claims and rule checks.
5. Add report/block/moderation flows.
6. Add complete Terms, Privacy Policy, Donation Policy, and Safety Policy.
7. Verify ClickPesa payment flow end-to-end in sandbox and production.
8. Verify push notifications on physical iOS and Android devices.
9. Verify Google Sign-In for production bundle IDs.
10. Test email verification and username setup.
11. Test banned user flow.
12. Test profile image upload and storage rules.
13. Test live spaces with multiple devices.
14. Add crash/error monitoring.
15. Add analytics with privacy consent.
16. Remove debug logs and sensitive console output.
17. Clean build artifacts from source control if not needed.
18. Prepare App Store and Play Store assets.

## 16. Developer Setup Manual

### 16.1 Requirements

- Node.js 18+
- npm
- Expo/EAS tooling
- Firebase project
- Google Sign-In configuration
- Groq API key
- ClickPesa credentials if payments are enabled
- Agora project if live audio is enabled

### 16.2 Install

```bash
npm install
```

### 16.3 Run

```bash
npm start
```

Then use Expo to open on iOS, Android, or a physical device.

### 16.4 Native Builds

```bash
npm run ios
npm run android
```

### 16.5 Environment Variables

The code expects values such as:

- `GROQ_API_KEY`
- `CLICKPESA_API_KEY`
- `CLICKPESA_CLIENT_ID`
- `CLICKPESA_API_URL`
- `CLICKPESA_CHECKSUM_KEY`

The Firebase app also uses `google-services.json` and `GoogleService-Info.plist`.

### 16.6 Firebase Deployments

Relevant files:

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`
- `functions/index.js`

Typical deployment:

```bash
firebase deploy
```

For production, deploy only after security rules and secrets are fixed.

## 17. App Manual For Non-Technical Stakeholders

Beloved is a faith-based mobile app that helps people pray, read scripture, connect with others, and support meaningful causes.

Users create an account, verify their email, and enter the app. They can read the Bible, listen to scripture, highlight verses, share verses, receive a daily scripture, and track their reading. They can generate prayers with AI, schedule prayer reminders, mark prayers complete, and review their prayer progress.

The community side lets users join live Bible study spaces, host their own spaces, follow others, view profiles, and receive notifications. The giving side lets users view charity campaigns, sponsors, and developer support options, then contribute through payment checkout.

The app can serve individuals, churches, youth groups, small groups, ministries, and donors. Its long-term potential is to become a spiritual social platform: daily devotion, AI-supported prayer, live fellowship, giving campaigns, and ministry tools in one place.

## 18. One-Sentence Pitch

Beloved is a Christian spiritual fellowship app that combines Bible reading, AI-powered prayer, prayer reminders, live group spaces, profiles, notifications, and charitable giving to help people grow spiritually and stay connected in community.

## 19. Short Investor / Partner Pitch

Beloved is a mobile-first faith community platform built for daily spiritual engagement. It brings together Bible reading, AI prayer assistance, habit tracking, live fellowship spaces, community profiles, notifications, and donation campaigns. For users, it creates a supportive place to pray, study, and connect. For churches and ministries, it can become a digital engagement layer. For developers and founders, it creates paths toward subscriptions, ministry dashboards, campaign tools, premium AI features, and community partnerships.

## 20. Current Product Status

Beloved already has many of the core pieces of a full mobile app:

- Authentication and onboarding.
- Main tab navigation.
- Bible reader.
- AI prayer generation.
- Prayer scheduling and history.
- Prayer analytics.
- Live space data model.
- Notification system.
- Profile and social graph features.
- Event and donation UI.
- Payment service integration.
- Cloud Functions for Agora tokens, push notifications, and payment webhooks.

The app is promising, but it should be treated as pre-production until security rules, secret handling, payment verification, AI safety, moderation, and legal/privacy policies are strengthened.

