import { getDropletPosition, LiquidProgressGauge } from "@/components/LiquidProgressGauge";
import Modal from "@/components/Modal";
import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import WeightScreen from "@/components/weight_tester";
import { constantColors } from "@/constants/colors";
import { UIIcons } from "@/constants/icon";
import { addWaterEntry, getUserSettings, getWaterIntake, saveWaterIntake, UserSettings } from "@/services/storage";
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { Dimensions, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";


interface WaterAdjustModalProps {
  onClose: () => void;
  onSave: (value: number) => void;
}

function WaterAdjustModal({ onClose, onSave }: WaterAdjustModalProps) {

  const [selectedValue, setSelectedValue] = useState(0);

  return (
    <View 
      className="bg-light-primary w-[90%] rounded-3xl overflow-hidden shadow-2xl border border-white/5"
    >
      <View className="p-8 pb-4 gap-5">
        <Text className="text-white text-lg text-center font-poppins-medium text-opacity-90">
          Add or Remove Water
        </Text>

        <View className="flex flex-row justify-between items-center">
          <TouchableOpacity onPress={() => setSelectedValue(prev => prev - 50)}>
            <UIIcons.remove color={constantColors.accent} size={30}/>
          </TouchableOpacity>

          <Text className="text-center text-white text-[50px] font-poppins-medium">{selectedValue}</Text>

          <TouchableOpacity onPress={() => setSelectedValue(prev => prev + 50)}>
            <UIIcons.add color={constantColors.accent} size={30}/>
          </TouchableOpacity>
        </View>

        <Text className="text-center text-sm text-white font-poppins-semibold border-2 border-white w-12 p-1 mx-auto mt-[-12px]">ml</Text>

        <Text className="text-white/40 text-sm text-center font-poppins-regular leading-tight">
          *Your water bottle already tracks your water intake. Increase or decrease if needed.
        </Text>
      </View>

      {/* Horizontal Line (hr) */}
      <View className="h-[1px] bg-white/5 self-stretch" />

      <View className="flex flex-row items-center">
        <TouchableOpacity 
          className="flex-1 py-5 items-center justify-center active:bg-white/5" 
          onPress={onClose}
        >
          <Text className="text-white/60 text-md font-poppins-medium">Close</Text>
        </TouchableOpacity>

        {/* Vertical Line (vr) */}
        <View className="w-[1px] bg-white/5 self-stretch" />

        <TouchableOpacity 
          className="flex-1 py-5 items-center justify-center active:bg-white/5" 
          onPress={() => onSave(selectedValue)}
        >
          <Text className="text-white text-md font-poppins-medium">Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function Index() {
  const [currentWaterIntake, setCurrentWaterIntake] = useState(0);
  const [userSettings, setUserSettings] = useState<UserSettings>({ recommendedWaterIntake: 2400, unit: 'ml' });
  const [gaugeKey, setGaugeKey] = useState(0);
  let recommendedWaterIntake = userSettings.recommendedWaterIntake;
  let userName = "Firuz";

  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [waterIntake, settings] = await Promise.all([
          getWaterIntake(),
          getUserSettings()
        ]);
        setCurrentWaterIntake(waterIntake);
        setUserSettings(settings);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Save water intake whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await saveWaterIntake(currentWaterIntake);
      } catch (error) {
        console.error('Error saving water intake:', error);
      }
    };

    saveData();
  }, [currentWaterIntake]);

  const updateWaterIntake = async (value: number) => {
    const newIntake = Math.max(0, currentWaterIntake + value);
    setCurrentWaterIntake(newIntake);

    // Also add to history if it's a positive addition
    if (value > 0) {
      try {
        await addWaterEntry(value);
      } catch (error) {
        console.error('Error adding water entry:', error);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Add your refresh logic here (fetch data, etc.)
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate refresh delay

    setRefreshing(false);
  }

  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

  // Position of water droplet SVG from LiquidProgressGauge
  const { size: dropletSize, positionX: dropletPositionX, positionY: dropletPositionY } = getDropletPosition(windowWidth, windowHeight);

  return (
    <ScreenBackgroundWrapper className="flex-1">
      <ScrollView
        scrollEnabled={!modalOpen}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flex: 1, flexGrow: 1, alignItems: "center", justifyContent: "center" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        // bounces={false}
        // overScrollMode="never"
      >
        <TouchableOpacity
          style={{ 
            position: 'absolute',
            top: dropletPositionY, 
            left: dropletPositionX,
            width: dropletSize, 
            height: dropletSize,
            borderRadius: dropletSize / 2,
            overflow: 'hidden',
            zIndex: 50
          }}
          activeOpacity={0.7}
          onPress={() => { setModalOpen(true) }}
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
          key={gaugeKey}
          width={windowWidth}
          height={windowHeight}
          value={currentWaterIntake}
          maxValue={recommendedWaterIntake}
          userName={userName}
        />
      </ScrollView>
      <WeightScreen onUpdateTotal={updateWaterIntake} />

    </ScreenBackgroundWrapper>

    
  );
}