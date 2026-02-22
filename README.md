# Nuon Water Tracking 💧

A smart water intake tracking application that connects to a Bluetooth-enabled water bottle to automatically monitor and log your daily hydration. Built with React Native (Expo) and designed for both iOS and Android.

## ✨ Features

### Smart Water Tracking
- **Automatic Bluetooth Tracking**: Connect to your smart water bottle device via Bluetooth LE to automatically log water intake in real-time
- **Manual Adjustments**: Fine-tune your intake with manual add/remove controls
- **Personalized Goals**: Calculates your recommended daily water intake based on:
  - Weight and height
  - Age and gender
  - Activity level (Sedentary, Moderate, High)
- **Custom Goals**: Override automatic calculations with your own personalized target

### Health & Statistics
- **Daily Progress Tracking**: Visual liquid gauge showing your progress toward daily goals
- **Historical Statistics**: View your hydration trends over time with interactive charts
- **Daily Summaries**: Automatic daily summary tracking with percentage completion
- **Intake Feedback**: Get contextual messages about your hydration status

### User Experience
- **Offline Mode**: Continues tracking even without internet connection, syncs automatically when back online
- **Dark Mode Support**: Automatic theme switching based on system preferences
- **Push Notifications**: Reminders to stay hydrated throughout the day
- **Personalized Profile**: Manage your health details and activity level
- **Privacy Focused**: Your data belongs to you

### Additional Features
- Network status indicator
- Haptic feedback for better interaction
- Beautiful gradient UI with liquid animations
- Settings management for water goals and personal details

## 📱 Installation

### Prerequisites
- Node.js 18 or later
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS: Xcode (for iOS builds)
- Android: Android Studio (for Android builds)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/nuon-water-tracking.git
cd nuon-water-tracking
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Appwrite Backend

This app uses [Appwrite](https://appwrite.io/) as its backend service. You'll need to set up an Appwrite project and configure the following:

#### Create an Appwrite Project
1. Sign up for [Appwrite Cloud](https://cloud.appwrite.io/) or self-host Appwrite
2. Create a new project
3. Note your Project ID and API Endpoint

#### Create Database Collections
Create a database and the following collections with these attributes:

**Users Collection**
- `userId` (string, required)
- `email` (string, required)
- `name` (string)
- `createdAt` (datetime)

**User Health Profiles Collection**
- `userId` (string, required, relationship to Users)
- `weight` (float, required) - in kg
- `height` (float, required) - in cm
- `age` (integer, required)
- `gender` (string, required) - 'male', 'female', or 'other'
- `activityLevel` (string, required) - 'Sedentary', 'Moderate', or 'High'
- `customGoal` (integer) - optional custom daily water goal in ml
- `updatedAt` (datetime)

**Water Intake Logs Collection**
- `userId` (string, required)
- `amount` (integer, required) - in ml
- `timestamp` (datetime, required)
- `source` (string) - 'manual' or 'bluetooth'
- `synced` (boolean, default: true)

**Daily Summaries Collection**
- `userId` (string, required)
- `date` (string, required) - format: 'YYYY-MM-DD'
- `totalIntake` (integer, required) - in ml
- `goal` (integer, required) - in ml
- `percentComplete` (float)
- `updatedAt` (datetime)

#### Configure Environment Variables
Create a `.env` file in the project root:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
EXPO_PUBLIC_APPWRITE_USERS_TABLE_ID=your_users_collection_id
EXPO_PUBLIC_APPWRITE_USER_HEALTH_PROFILES_TABLE_ID=your_health_profiles_collection_id
EXPO_PUBLIC_APPWRITE_WATER_INTAKE_LOGS_TABLE_ID=your_water_logs_collection_id
EXPO_PUBLIC_APPWRITE_DAILY_SUMMARIES_TABLE_ID=your_daily_summaries_collection_id
```

Replace the placeholder values with your actual Appwrite project details.

## 🚀 Running the App

### Development Mode

```bash
npx expo start
```

This will start the development server. You can then:
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Scan the QR code with Expo Go app (limited Bluetooth support)

### Development Build (Recommended for Bluetooth)

Since this app uses Bluetooth LE, you'll need a development build:

```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

## 📦 Building for Production
0. Make sure to create prebuild and have pods installed in the ios folder:
```bash
npx expo prebuild --platform ios
cd ios
pod install
cd ..
```
1. Run the following command to create a production build on ios:
```bash
npx expo run:ios --device --configuration Release
````

### Using EAS Build (Recommended)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to your Expo account:
```bash
eas login
```

3. Configure the build:
```bash
eas build:configure
```

4. Build for Android:
```bash
eas build --platform android
```

5. Build for iOS:
```bash
eas build --platform ios
```

### Local Builds

#### Android APK
```bash
npx expo run:android --variant release
```

The APK will be generated in `android/app/build/outputs/apk/release/`

#### iOS IPA
Follow the [iOS build instructions](ios-build-intructions.txt) in the repository.

## 🔧 Hardware

The app connects to a custom ESP32-based water bottle tracking device via Bluetooth LE. The hardware code is included in the `Hardware/` directory with multiple versions:
- `bluetoothtest2withbutton/` - Basic version with button integration
- `bluetoothtest2withbuttonevents/` - Event-based version
- `bluetoothtest2withbuttoneventsupdated/` - Latest enhanced version

The device measures water consumption using a weight sensor and transmits the data to the app automatically. Additional hardware documentation and build instructions will be added in a future update.

## 📂 Project Structure

```
nuon-water-tracking/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (onboarding)/      # Onboarding flow
│   ├── (tabs)/            # Main app tabs (home, statistics, settings)
│   └── settings/          # Settings sub-pages
├── components/            # Reusable components
├── ble/                   # Bluetooth service
├── services/              # Appwrite & API services
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
├── constants/             # App constants & theme
├── assets/                # Images, icons, fonts
└── Hardware/              # ESP32 Arduino code
```

## 🛠 Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Appwrite
- **Bluetooth**: react-native-ble-plx
- **State Management**: Zustand
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Charts**: react-native-gifted-charts
- **Offline Storage**: AsyncStorage
- **Animations**: React Native Reanimated & Skia

## 🔒 Privacy & Data

Your health and hydration data is stored securely in your Appwrite backend. The app includes:
- Offline-first architecture with automatic sync
- Local data caching for privacy
- No third-party analytics or tracking
- User-controlled data through Appwrite dashboard

## 📄 License

This project was created as an educational school project and is made publicly available for learning and inspiration purposes.

**Permissions:**
- ✅ Personal use
- ✅ Educational use
- ✅ Modification for learning purposes
- ✅ Use as reference or inspiration for similar projects
- ❌ Commercial use

**Attribution:**
If you use this project as a reference or inspiration for your own work, we appreciate attribution by linking back to this repository.

For any questions about usage rights, please open an issue in the repository.

## 🐛 Troubleshooting

### Bluetooth Not Working
- Ensure you're using a development build, not Expo Go
- Check that Bluetooth permissions are granted in device settings
- Verify the device is powered on and in range

### App Not Syncing
- Check your internet connection
- Verify Appwrite credentials in `.env` file
- Check Appwrite console for API errors

### Build Errors
- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Android/iOS build checklist: `ANDROID_TESTING_CHECKLIST.md`

## 📞 Support

For issues or questions, please open an issue in the GitHub repository.
