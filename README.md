# Beloved - Spiritual Fellowship App 🕊️

**Beloved** is a modern spiritual lifestyle application designed to foster connection, prayer, and growth. Built with **React Native** and **Expo**, it leverages **AI** for personalized spiritual guidance and **Real-time** features for community fellowship.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-green)
![Tech](https://img.shields.io/badge/tech-React%20Native%20%7C%20Firebase%20%7C%20Groq%20AI-orange)

---

## 📱 Key Features

### 🤖 AI Prayer Assistant
- **Personalized Prayers**: Uses **Groq AI** to generate context-aware prayers based on user mood and bible topics.
- **Text-to-Speech**: Listen to prayers with premium voice synthesis.

### 📖 Bible Experience
- **Smart Reader**: Navigate by Book, Chapter, or specific Topics (e.g., "Anxiety", "Joy").
- **Audio Bible**: Integrated text-to-speech for on-the-go listening.
- **Tracking**: Tracks reading history and awards badges for milestones.

### 🌍 Community Spaces
- **Live Fellowship**: Join audio/chat spaces to discuss topics.
- **Social Graph**: Follow friends, track "Fellowship" stats, and view profiles.
- **Badges & Rewards**: Earn ranks (Bronze, Silver, Gold) for engagement.

### ⚙️ User Profile & Privacy
- **Demographics**: Tracks Age/Gender for community insights.
- **Privacy Controls**: Users can toggle visibility of their personal details.
- **Mood Tracking**: Update and share your current spiritual mood.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) / [Expo SDK 52](https://expo.dev/)
- **Backend**: [Firebase](https://firebase.google.com/) (Auth, Firestore, Functions)
- **AI Engine**: [Groq API](https://groq.com/) (LLM High-Performance Inference)
- **Audio/Voice**: `expo-av`, Native Speech
- **Real-time**: Firebase Listeners (Snapshots)
- **Navigation**: React Navigation (Stack + Tabs)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Expo CLI**: `npm install -g expo-cli`
- **Firebase Project**: Setup a project with Auth and Firestore.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/iheartcalvin/Beloved.git
    cd Beloved
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    # AI Configuration
    GROQ_API_KEY=your_groq_api_key_here

    # Firebase Configuration (If not using google-services.json)
    EXPO_PUBLIC_FIREBASE_API_KEY=...
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
    ```
    *Note: Ensure `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are placed in the root for native Firebase linking.*

4.  **Run the App**
    ```bash
    npx expo start
    ```
    - Press `i` for iOS Simulator.
    - Press `a` for Android Emulator.
    - Scan QR code with Expo Go.

---

## 📂 Project Structure

```
Beloved/
├── assets/             # Images and static assets
├── src/
│   ├── components/     # Reusable UI components (Modals, Cards)
│   ├── context/        # React Context (Auth, Notifications)
│   ├── navigation/     # Stack and Tab Navigators
│   ├── screens/        # Application Screens
│   ├── services/       # API Services (UserService, AIService, etc.)
│   └── theme/          # Colors, Gradients, Spacing
├── App.js              # Entry point
└── app.json            # Expo Configuration
```

---

## 🛡️ Admin & Moderation
The Admin Panel is a separate web-based dashboard for managing users, viewing statistics, and handling moderation.
- **Repo**: [Beloved-Admin](https://github.com/iheartcalvin/Beloved-Admin) *
- **Features**: User Bans, Demographics Charts, Space Management.

---

## 🤝 Contributing
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License
Distributed under the MIT License.
