import { getDropletPosition, LiquidProgressGauge } from "@/components/LiquidProgressGauge";
import Modal from "@/components/Modal";
import ScreenBackgroundWrapper from "@/components/ScreenBackgroundWrapper";
import { useRouter } from 'expo-router';
import React, { useRef, useState } from "react";
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";


interface WaterAdjustModalProps {
  onClose: () => void;
  onSave: (value: number) => void;
}

function WaterAdjustModal({ onClose, onSave }: WaterAdjustModalProps) {
  // STEP 1: Generate numbers array from -5000 to 5000 in steps of 10
  const numbers = Array.from({ length: 1001 }, (_, i) => (i - 500) * 10);
  
  // STEP 2: Track which number is selected (starts at 0)
  const [selectedValue, setSelectedValue] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [hasScrolledToStart, setHasScrolledToStart] = useState(false);
  
  // STEP 3: Define sizing constants - wider to show only 3 numbers
  const ITEM_WIDTH = 120; // Increased width to show fewer numbers
  
  // Scroll to 0 (index 500) when modal opens
  React.useEffect(() => {
    if (containerWidth > 0 && !hasScrolledToStart) {
      const centerIndex = 500; // Index where value is 0
      const scrollToX = centerIndex * ITEM_WIDTH;
      
      // Immediate scroll with multiple attempts to ensure it sticks
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({ x: scrollToX, animated: false });
        // Force another scroll after a tiny delay to fix initial positioning
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ x: scrollToX, animated: false });
          setHasScrolledToStart(true);
        }, 50);
      });
      setSelectedValue(0); // Ensure it's set immediately
    }
  }, [containerWidth, hasScrolledToStart]);
  
  // STEP 4: Update selection IMMEDIATELY during scroll (iPhone-style smooth)
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    // Always update to the NEAREST number, even while scrolling
    const index = Math.round(scrollX / ITEM_WIDTH);
    
    if (numbers[index] !== undefined) {
      setSelectedValue(numbers[index]);
    }
  };

  return (
    <View 
      className="bg-light-primary w-[90%] rounded-3xl overflow-hidden shadow-2xl border border-white/5"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <View className="p-8 pb-4 gap-6">
        <Text className="text-white text-lg text-center font-poppins-medium text-opacity-90">
          Add or Remove Water
        </Text>

        {/* STEP 5: The Number Picker Container */}
        <View className="h-32 justify-center items-center relative">
          {containerWidth > 0 && (
            <>
              {/* Display the selected value on TOP - never clips */}
              <View className="absolute z-20 pointer-events-none" style={{ width: containerWidth }}>
                <Text
                  allowFontScaling={false}
                  className="text-white text-[56px] font-poppins-semibold text-center"
                  style={{
                    includeFontPadding: false,
                  }}
                >
                  {selectedValue > 0 ? `+${selectedValue}` : selectedValue}
                </Text>
              </View>
              
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                // STEP 6: Snapping configuration
                snapToInterval={ITEM_WIDTH}
                snapToAlignment="center"
                decelerationRate="normal" // Normal for velocity-based scrolling
                scrollEnabled={true}
                nestedScrollEnabled={true}
                contentContainerStyle={{
                  // STEP 7: Padding allows first/last items to reach center
                  paddingHorizontal: (containerWidth - ITEM_WIDTH) / 2,
                  alignItems: 'center',
                }}
                // STEP 8: Track scroll in REAL-TIME (every frame)
                onScroll={handleScroll}
                scrollEventThrottle={16} // 60fps smooth updates
              >
                {numbers.map((num) => {
                  const isSelected = num === selectedValue;
                  return (
                    <View 
                      key={num} 
                      style={{ width: ITEM_WIDTH }} 
                      className="items-center justify-center h-full"
                    >
                      <Text
                        allowFontScaling={false}
                        className={`font-poppins-medium text-[28px] ${
                          isSelected ? "opacity-0" : "text-gray-600"
                        }`}
                        style={{
                          includeFontPadding: false,
                        }}
                      >
                        {num > 0 ? `+${num}` : num}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>

        <Text className="text-white/40 text-sm text-center px-4 font-poppins-regular leading-tight">
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
          <Text className="text-white text-md font-poppins-semibold">Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function Index() {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
              // STEP 9: Use the selected value here
              console.log('Selected adjustment:', value);
              // TODO: Update your water intake with this value
              setModalOpen(false);
            }}
          />
        </Modal>

        <LiquidProgressGauge
          width={windowWidth}
          height={windowHeight}
          value={1200}
          maxValue={2400}
          userName="Firuz"
        />

      </ScrollView>
    </ScreenBackgroundWrapper>
  );
}