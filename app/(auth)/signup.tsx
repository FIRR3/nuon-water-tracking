import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { useAuth } from "@/hooks/useAuth";
import { account, databases } from "@/services/appwrite";
import { ID } from "appwrite";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
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
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      // Create account
      const authAccount = await account.create(
        ID.unique(),
        email,
        password,
        `${firstName} ${lastName}`,
      );

      // Create session (login)
      await account.createEmailPasswordSession(email, password);

      login(); // Update local auth state
      // Router will redirect to onboarding
    } catch (error: any) {
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
            <Animated.View
              entering={FadeInDown.duration(1000).springify()}
              className="bg-dark-secondary p-5 rounded-lg w-full"
            >
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor={"gray"}
                className="text-white font-poppins"
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(200).duration(1000).springify()}
              className="bg-dark-secondary p-5 rounded-lg w-full"
            >
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor={"gray"}
                className="text-white font-poppins"
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(300).duration(1000).springify()}
              className="bg-dark-secondary p-5 rounded-lg w-full"
            >
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={"gray"}
                className="text-white font-poppins"
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(400).duration(1000).springify()}
              className="bg-dark-secondary p-5 rounded-lg w-full mb-3"
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                keyboardType="visible-password"
                autoCapitalize="none"
                secureTextEntry
                placeholderTextColor={"gray"}
                className="text-white font-poppins"
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(500).duration(1000).springify()}
              className="w-full"
            >
              <TouchableOpacity
                onPress={handleSignup}
                disabled={loading}
                className="w-full bg-dark-accent p-3 rounded-2xl mb-3"
              >
                <Text className="text-md font-poppins-semibold text-white text-center">
                  {loading ? "Creating..." : "Create account"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(600).duration(1000).springify()}
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