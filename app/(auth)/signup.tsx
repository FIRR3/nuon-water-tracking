import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { useAuth } from "@/hooks/useAuth";
import {
  account,
  DATABASE_ID,
  databases,
  USERS_TABLE_ID,
} from "@/services/appwrite";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ID } from "appwrite";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function SignupScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const authBackground = require("../../assets/images/auth-background.png");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loading, setLoading] = useState(false);

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const toggleDatePicker = () => {
    setShowDatePicker((prev) => !prev);
  };

  const handleDateChange = ({ type }: any, selectedDate: any) => {
    if (type == "set") {
      const currentDate = selectedDate;
      setDate(currentDate);

      if (Platform.OS === "android") {
        toggleDatePicker();
        // Use local date methods
        setDateOfBirth(
          `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`,
        );
        emailRef.current?.focus();
      }
    } else {
      toggleDatePicker();
    }
  };
  const confirmIOSDate = () => {
    setDateOfBirth(
      `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
    );
    toggleDatePicker();

    emailRef.current?.focus();
  };

  const handleSignup = async () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password || !trimmedFirstName || !trimmedLastName) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    let authAccountId: string | null = null;

    try {
      // 1. Create auth account
      const authAccount = await account.create(
        ID.unique(),
        trimmedEmail,
        password,
        `${trimmedFirstName} ${trimmedLastName}`,
      );

      // 2. Create session (login)
      await account.createEmailPasswordSession(email, password);

      // 3. Create user document in database
      await databases.createDocument(
        DATABASE_ID,
        USERS_TABLE_ID,
        authAccount.$id,
        {
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          email: trimmedEmail,
          birthday: new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
          ).toISOString(),
          hasCompletedOnboarding: false, // Track onboarding status
        },
      );

      // 4. Update local auth state with user ID
      login(authAccount.$id);
      // Root layout will automatically redirect to onboarding
    } catch (error: any) {
      if (authAccountId) {
        try {
          await account.deleteSession("current"); // Log out
          // Note: Can't delete the account itself without admin API
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
      }
      Alert.alert("Signup Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackgroundWrapper dismissKeyboard className="size-full">
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Image className="size-full absolute" source={authBackground} />
        <View className="size-full flex justify-around pt-40 pb-10">
          <View className="flex items-center">
            <Animated.Text
              entering={FadeInUp.duration(1000).springify()}
              className="text-white font-poppins-semibold text-[40px] mb-5"
            >
              Sign up
            </Animated.Text>
          </View>

          <View className="flex items-center mx-4 gap-5">
            <View className="w-full flex-row gap-5">
              <Animated.View
                entering={FadeInDown.duration(1000).springify()}
                className="bg-dark-secondary p-5 rounded-lg flex-1"
              >
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                  placeholderTextColor={"gray"}
                  className="text-white font-poppins"
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  submitBehavior="blurAndSubmit"
                />
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(100).duration(1000).springify()}
                className="bg-dark-secondary p-5 rounded-lg flex-1"
              >
                <TextInput
                  ref={lastNameRef}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                  placeholderTextColor={"gray"}
                  className="text-white font-poppins"
                  onSubmitEditing={() => {
                    {
                      toggleDatePicker();
                    }
                  }}
                />
              </Animated.View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()}
                textColor="#FFFFFF"
                style={{ height: 120, marginTop: -10 }}
              />
            )}

            {showDatePicker && Platform.OS === "ios" && (
              <Animated.View
                entering={FadeInDown.delay(200).duration(1000).springify()}
                className="flex-row w-full gap-2"
              >
                <TouchableOpacity
                  onPress={toggleDatePicker}
                  className="flex-1 border-2 border-light-secondary py-[10px] px-4 rounded-xl"
                >
                  <Text className="text-white text-center text-md font-poppins-medium">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmIOSDate}
                  className="flex-1 bg-dark-accent py-[12px] px-4 rounded-xl"
                >
                  <Text className="text-white text-center text-md font-poppins-medium">
                    Confirm
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {!showDatePicker && (
              <Animated.View
                entering={FadeInDown.delay(200).duration(1000).springify()}
                className="bg-dark-secondary p-5 rounded-lg w-full"
              >
                <Pressable onPress={toggleDatePicker}>
                  <TextInput
                    placeholder="Date of birth"
                    value={dateOfBirth}
                    onChangeText={setDateOfBirth}
                    placeholderTextColor={"gray"}
                    editable={false}
                    onPressIn={toggleDatePicker}
                    className="text-white font-poppins"
                    submitBehavior="blurAndSubmit"
                  />
                </Pressable>
              </Animated.View>
            )}

            <Animated.View
              entering={FadeInDown.delay(300).duration(1000).springify()}
              className="bg-dark-secondary p-5 rounded-lg w-full"
            >
              <TextInput
                ref={emailRef}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={"gray"}
                className="text-white font-poppins"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                submitBehavior="blurAndSubmit"
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(400).duration(1000).springify()}
              className="bg-dark-secondary p-5 rounded-lg w-full"
            >
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                autoCapitalize="none"
                secureTextEntry
                placeholderTextColor={"gray"}
                className="text-white font-poppins"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(600).duration(1000).springify()}
              className="w-full"
            >
              <TouchableOpacity
                onPress={handleSignup}
                disabled={loading}
                className="w-full bg-dark-accent p-3 rounded-2xl mb-3"
              >
                <Text className="text-md font-poppins-medium text-white text-center">
                  {loading ? "Creating..." : "Create account"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(700).duration(1000).springify()}
              className="flex-row justify-center"
            >
              <Text className="text-white font-poppins">
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text className="text-dark-accent font-poppins">Log in</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenBackgroundWrapper>
  );
}
