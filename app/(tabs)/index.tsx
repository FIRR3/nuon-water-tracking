import {
  getDropletPosition,
  LiquidProgressGauge,
} from "@/components/LiquidProgressGauge";
import Modal from "@/components/Modal";
import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { useTheme } from "@/components/ThemeContext";
import WeightScreen from "@/components/weight_tester";
import { constantColors } from "@/constants/colors";
import { UIIcons } from "@/constants/icon";
import { getUserSettings, UserSettings } from "@/services/storage";
import {
  calculateProgress,
  getIntakeExplanation,
} from "@/utils/waterCalculations";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUserStore } from "../../hooks/useUserStore";

interface WaterAdjustModalProps {
  onClose: () => void;
  onSave: (value: number) => void;
}

function WaterAdjustModal({ onClose, onSave }: WaterAdjustModalProps) {
  const [selectedValue, setSelectedValue] = useState(0);
  const { colors } = useTheme();

  return (
    <View className="bg-light-secondary dark:bg-dark-secondary w-[90%] rounded-3xl overflow-hidden shadow-2xl border border-light-primary/5 dark:border-white/5">
      <View className="p-8 pb-4 gap-5">
        <Text className="text-light-primary dark:text-dark-primary text-lg text-center font-poppins-medium text-opacity-90">
          Add or Remove Water
        </Text>

        <View className="flex flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => setSelectedValue((prev) => prev - 50)}
          >
            <UIIcons.remove color={constantColors.accent} size={30} />
          </TouchableOpacity>

          <Text className="text-center text-light-primary dark:text-dark-primary text-[50px] font-poppins-medium">
            {selectedValue}
          </Text>

          <TouchableOpacity
            onPress={() => setSelectedValue((prev) => prev + 50)}
          >
            <UIIcons.add color={constantColors.accent} size={30} />
          </TouchableOpacity>
        </View>

        <Text className="text-center text-sm text-light-primary dark:text-dark-primary font-poppins-semibold border-2 border-light-primary dark:border-white w-12 p-1 mx-auto mt-[-12px]">
          ml
        </Text>

        <Text className="text-light-primary/40 dark:text-white/40 text-sm text-center font-poppins-regular leading-tight">
          *Your water bottle already tracks your water intake. Increase or
          decrease if needed.
        </Text>
      </View>

      {/* Horizontal Line (hr) */}
      <View className="h-[1px] bg-light-primary/5 dark:bg-white/5 self-stretch" />

      <View className="flex flex-row items-center">
        <TouchableOpacity
          className="flex-1 py-5 items-center justify-center active:bg-light-primary/5 dark:active:bg-white/5"
          onPress={onClose}
        >
          <Text className="text-light-primary/60 dark:text-white/60 text-md font-poppins-medium">
            Close
          </Text>
        </TouchableOpacity>

        {/* Vertical Line (vr) */}
        <View className="w-[1px] bg-light-primary/5 dark:bg-white/5 self-stretch" />

        <TouchableOpacity
          className="flex-1 py-5 items-center justify-center active:bg-light-primary/5 dark:active:bg-white/5"
          onPress={() => onSave(selectedValue)}
        >
          <Text className="text-light-primary dark:text-dark-primary text-md font-poppins-medium">
            Save
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function Index() {
  const {
    userProfile,
    healthProfile,
    recommendedIntake,
    totalToday,
    isLoading,
    fetchUserData,
    addWaterIntake: addWaterIntakeToCloud,
    refreshTodayIntake,
    syncOfflineData,
    setupSyncListener,
    syncStatus,
    pendingSyncCount,
  } = useUserStore();

  useEffect(() => {
    fetchUserData();

    // Set up sync listener
    const unsubscribe = setupSyncListener();
    return () => unsubscribe();
  }, []);

  // if (isLoading) {
  //   return <ActivityIndicator size="large" />;
  // }

  const waterGoal =
    healthProfile?.customWaterGoal || recommendedIntake || "2400";

  const progress = calculateProgress(totalToday, recommendedIntake);
  const explanation = getIntakeExplanation(recommendedIntake);

  const [userName, setUserName] = useState(userProfile?.firstName || "there");
  const [currentWaterIntake, setCurrentWaterIntake] = useState(totalToday || 0);
  const [bleStatus, setBleStatus] = useState("Initializing...");
  const [userSettings, setUserSettings] = useState<UserSettings>({
    customWaterGoal: waterGoal,
    unit: "ml",
  });

  // Use cloud value from store as primary, fallback to local settings
  let recommendedWaterIntake =
    recommendedIntake || userSettings.customWaterGoal || 2400;

  useEffect(() => {
    // Set userName with fallback to "there" if firstName is not available
    const name = userProfile?.firstName || "there";
    console.log("👤 Setting userName:", name, "from userProfile:", userProfile);
    setUserName(name);
  }, [userProfile]);

  // Sync currentWaterIntake with totalToday from store
  useEffect(() => {
    console.log("💧 Updating currentWaterIntake:", totalToday);
    setCurrentWaterIntake(totalToday || 0);
  }, [totalToday]);

  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Function to refresh water intake from cloud
  const refreshWaterIntake = async () => {
    try {
      await refreshTodayIntake();
      console.log("Refreshed water intake from cloud:", totalToday);
    } catch (error) {
      console.error("Error refreshing water intake:", error);
    }
  };

  // Load user settings from local storage (for backwards compatibility)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getUserSettings();
        console.log("Loaded settings from local storage:", settings);
        setUserSettings(settings);
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();
  }, []);

  // Refresh water intake when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshWaterIntake();
    }, []),
  );

  const updateWaterIntake = async (value: number) => {
    console.log("🔄 updateWaterIntake called with value:", value);
    try {
      if (value !== 0) {
        // Use cloud storage via useUserStore
        const result = await addWaterIntakeToCloud(value, "manual");
        console.log(
          "✅ Successfully updated water intake:",
          value,
          "result:",
          result,
        );
      }
    } catch (error) {
      console.error("❌ Error updating water intake:", error);
      // Entry was still saved locally, so don't show error to user
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);

    // Refresh from cloud
    await refreshWaterIntake();

    // Trigger offline sync if there are pending items
    if (pendingSyncCount > 0) {
      try {
        await syncOfflineData();
        console.log("Synced offline data during refresh");
      } catch (error) {
        console.error("Error syncing offline data:", error);
      }
    }

    // Reload user settings
    try {
      const settings = await getUserSettings();
      setUserSettings(settings);
    } catch (error) {
      console.error("Error loading settings:", error);
    }

    setRefreshing(false);
  };

  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

  // Position of water droplet SVG from LiquidProgressGauge
  const {
    size: dropletSize,
    positionX: dropletPositionX,
    positionY: dropletPositionY,
  } = getDropletPosition(windowWidth, windowHeight);

  return (
    <ScreenBackgroundWrapper className="flex-1">
      <ScrollView
        scrollEnabled={!modalOpen}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flex: 1,
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <TouchableOpacity
          style={{
            position: "absolute",
            top: dropletPositionY,
            left: dropletPositionX,
            width: dropletSize,
            height: dropletSize,
            borderRadius: dropletSize / 2,
            overflow: "hidden",
            zIndex: 50,
          }}
          activeOpacity={0.7}
          onPress={() => {
            setModalOpen(true);
          }}
        />

        <Modal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)}>
          <WaterAdjustModal
            onClose={() => setModalOpen(false)}
            onSave={(value) => {
              updateWaterIntake(value);
              setModalOpen(false);
            }}
          />
        </Modal>

        <LiquidProgressGauge
          width={windowWidth}
          height={windowHeight}
          value={currentWaterIntake || 0}
          maxValue={waterGoal || 2400}
          userName={userName || "there"}
        />
      </ScrollView>
      <WeightScreen
        onUpdateTotal={updateWaterIntake}
        onStatusChange={setBleStatus}
      />
    </ScreenBackgroundWrapper>
  );
}
