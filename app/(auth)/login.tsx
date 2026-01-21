import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { useAuth } from "@/hooks/useAuth";
import { account } from "@/services/appwrite";
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

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const authBackground = require("../../assets/images/auth-background.png");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      await account.createEmailPasswordSession(email, password);
      login();
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
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
              Log in
            </Animated.Text>
          </View>

          <View className="flex items-center mx-4 gap-5">
            <Animated.View
              entering={FadeInDown.duration(1000).springify()}
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
              entering={FadeInDown.delay(200).duration(1000).springify()}
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
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(400).duration(1000).springify()}
              className="w-full"
            >
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className="w-full bg-dark-accent p-3 rounded-2xl mb-3"
              >
                <Text className="text-md font-poppins-semibold text-white text-center">
                  {loading ? "Logging in..." : "Log in"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(600).duration(1000).springify()}
              className="flex-row justify-center"
            >
              <Text className="text-white font-poppins">
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                <Text className="text-dark-accent font-poppins">Sign up</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenBackgroundWrapper>
  );
}