import { useThemeColors } from "@/hooks/useThemeColors";
import {
  Canvas,
  Group,
  LinearGradient,
  Path,
  Rect,
  Skia,
  SkPath,
  Text,
  useFont,
  vec
} from "@shopify/react-native-skia";
import { area, scaleLinear } from "d3";
import React, { useEffect } from "react";
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type Props = {
  width: number;
  height: number;
  value: number;
  maxValue: number;
  userName: string;
  onDropletPress?: () => void;
};

export const LiquidProgressGauge = ({ width, height, value, maxValue, userName, onDropletPress }: Props) => {
  const colors = useThemeColors();

  // Rectangle dimensions
  // Width and Height come as props
  // const borderThickness = 0;  --optional
  const fillRectMargin = 0;   // --set to borderThickness
  const fillRectWidth = width - fillRectMargin * 2;
  const fillRectHeight = height - fillRectMargin * 2;

  const minValue = 0;
  const fillPercent = Math.max(minValue, Math.min(maxValue, value)) / maxValue;

  // Font
  const fontSize = Math.min(width, height) / 5;
  const font = useFont(
    require("../assets/fonts/Poppins/Poppins-SemiBold.ttf"),
    fontSize
  );
  const mediumFontSize = fontSize * 0.4;
  const mediumFont = useFont(
    require("@/assets/fonts/Poppins/Poppins-Bold.ttf"),
    mediumFontSize
  );
  const smallFontSize = fontSize * 0.2;
  const smallFont = useFont(
    require("../assets/fonts/Poppins/Poppins-Medium.ttf"),
    smallFontSize
  );


  // Central SVG droplet button logic
  // Increase droplet size, keep perfectly centered
  const dropletSize = Math.min(width, height) * 0.28; // Increased from 0.18 to 0.32
  // Feather droplet SVG path (36x36 viewBox)
  const dropletSvgPath =
    "M 18.00,4.04 C 18.00,4.04 26.49,12.52 26.49,12.52 28.66,14.70 30.01,17.70 30.01,21.01 30.01,27.64 24.63,33.01 18.01,33.01 11.38,33.01 6.01,27.64 6.01,21.01 6.01,17.70 7.35,14.70 9.52,12.53 9.52,12.53 18.00,4.04 18.00,4.04 Z";
  const dropletCenterX = width / 2;
  const dropletCenterY = height / 2 + fontSize * 0.4;
  const dropletPathRaw = Skia.Path.MakeFromSVGString(dropletSvgPath);
  // Center and scale droplet for 36x36 viewBox
  let dropletPath = null;
  if (dropletPathRaw) {
    const dropletTransform = Skia.Matrix();
    dropletTransform.translate(dropletCenterX - dropletSize / 2, dropletCenterY - dropletSize / 2);
    dropletTransform.scale(dropletSize / 36, dropletSize / 36); // SVG viewBox is 36x36
    dropletPathRaw.transform(dropletTransform);
    dropletPath = dropletPathRaw;
  }
  // Dynamic color: inside wave = background, outside = primary
  const dropletIsInWave = fillPercent > 0.5; // Covered if more than half full
  const dropletColor = dropletIsInWave ? colors.background : colors.primary;

  // Wave parameters
  const waveCount = 1;
  const waveClipCount = waveCount + 1;
  const waveLength = fillRectWidth / waveCount;
  const waveClipWidth = waveLength * waveClipCount;
  const waveHeight = (value >= maxValue) ? 0 : fillRectHeight * 0.03; // flatten out wave at top height

  // Dynamic greeting text position and font
  const greetingText = "Hello  ";
  const greetingName = userName;
  const greetingExcl = " !";
  const greetingTextWidth = smallFont?.getTextWidth(greetingText) ?? 0;
  // Username in bold, but at smallFontSize
  const boldSmallFont = useFont(
    require("@/assets/fonts/Poppins/Poppins-Bold.ttf"),
    smallFontSize
  );
  const greetingNameWidth = boldSmallFont?.getTextWidth(greetingName) ?? 0;
  const greetingX = 25;
  const greetingY = smallFontSize * 8;

  // Value text and 'ml' text width
  const valueText = `${value}`;
  const mlText = "ml";

  const valueTextWidth = font?.getTextWidth(valueText) ?? 0;
  const mlTextWidth = mediumFont?.getTextWidth(mlText) ?? 0;

  const totalTextWidth = valueTextWidth + mlTextWidth + fontSize * 0.1; // spacing
  const textTranslateX = width / 2 - totalTextWidth / 2;
  const textTranslateY = height / 4;
  const textTransform = [{ translateY: textTranslateY }];

  // x ml remaining text
  const waterRemainingText = value < maxValue ? `Remaining: ${maxValue - value}ml` : "Goal achieved!";
  const waterRemainingTextWidth = smallFont?.getTextWidth(waterRemainingText) ?? 0;
  const waterRemainingTranslateX = width / 2 - waterRemainingTextWidth / 2;
  const waterRemainingTranslateY = textTranslateY + fontSize * 0.4;
  const waterRemainingTransform = [{ translateY: waterRemainingTranslateY }];

  // Data for building the clip wave area for rectangle
  const data: Array<[number, number]> = [];
  for (let i = 0; i <= 40 * waveClipCount; i++) {
    data.push([i / (40 * waveClipCount), i / 40]);
  }

  const waveScaleX = scaleLinear().range([0, waveClipWidth]).domain([0, 1]);
  const waveScaleY = scaleLinear().range([0, waveHeight]).domain([0, 1]);

  // Animation phase for seamless wave
  const wavePhase = useSharedValue(0);

  // Reset wave animation on value change for a smooth experience
  useEffect(() => {
    wavePhase.value = 0;
    wavePhase.value = withRepeat(
      withTiming(1, {
        duration: 9000,
        easing: Easing.linear,
      }),
      -1
    );
  }, [value]);

  // Animated fill height for gradient and wave
  const waveFillHeightAnimated = useDerivedValue(() => {
    return fillRectHeight * fillPercent;
  }, [fillPercent, fillRectHeight]);

  // area for rectangle, uses phase for seamless animation
  const clipArea = area()
    .x(function (d: [number, number]) {
      return waveScaleX(d[0]);
    })
    .y0(function (d: [number, number]) {
      // Use phase for seamless animation
      const phase = (wavePhase.value % 1) * 2 * Math.PI;
      return (
        fillRectHeight * (1 - fillPercent) +
        waveScaleY(Math.sin(d[1] * 2 * Math.PI + phase))
      );
    })
    .y1(function (_d: [number, number]) {
      return fillRectHeight + waveHeight;
    });

  const clipSvgPath = clipArea(data);

  const translateXAnimated = useSharedValue(0);
  const translateYPercent = useSharedValue(0);
  const textValue = useSharedValue(0);

  useEffect(() => {
    textValue.value = withTiming(value, {
      duration: 1000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const text = useDerivedValue(() => {
    return `${textValue.value.toFixed(0)}`;
  }, [textValue]);

  useEffect(() => {
    translateYPercent.value = withTiming(fillPercent, {
      duration: 5000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillPercent]);

  useEffect(() => {
    translateXAnimated.value = withRepeat(
      withTiming(1, {
        duration: 9000,
        easing: Easing.linear,
      }),
      -1
    );
  }, []);

  // Gradient follows the wave crest
  const gradientStartY = fillRectHeight;
  const gradientEndY = Math.min(fillRectHeight, fillRectHeight * (1 - fillPercent) + waveHeight);

  const clipPath = useDerivedValue(() => {
    const clipP: SkPath | null = Skia.Path.MakeFromSVGString(clipSvgPath);
    if (!clipP) return null;
    const transformMatrix = Skia.Matrix();
    transformMatrix.translate(
      fillRectMargin - waveLength * wavePhase.value,
      fillRectMargin
    );
    clipP.transform(transformMatrix);
    return clipP;
  }, [wavePhase, waveFillHeightAnimated]);

  // Helper: check if point is inside droplet bounds
  function isPointInDroplet(x: number, y: number) {
    return (
      x >= dropletCenterX - dropletSize / 2 &&
      x <= dropletCenterX + dropletSize / 2 &&
      y >= dropletCenterY - dropletSize / 2 &&
      y <= dropletCenterY + dropletSize / 2
    );
  }

  // Plus icon SVG path (centered in droplet, visually pixel-perfect)
  const plusSize = dropletSize * 0.2;
  // Further adjust center for pixel-perfect centering
  const plusCenterX = width/2 - plusSize/2;
  const plusCenterY = dropletCenterY - plusSize * 0.9;
  const plusSvgPath =
    "M 18 17.5 a 1.2 1.2 0 0 1 1.2 1.2 v 2.8 h 2.8 a 1.2 1.2 0 0 1 0 2.4 h -2.8 v 2.8 a 1.2 1.2 0 0 1 -2.4 0 v -2.8 h -2.8 a 1.2 1.2 0 0 1 0 -2.4 h 2.8 v -2.8 a 1.2 1.2 0 0 1 1.2 -1.2 Z";
  const plusPathRaw = Skia.Path.MakeFromSVGString(plusSvgPath);
  let plusPath = null;
  if (plusPathRaw) {
    const plusTransform = Skia.Matrix();
    plusTransform.translate(plusCenterX - plusSize, plusCenterY - plusSize / 2);
    plusTransform.scale(plusSize / 12, plusSize / 12); // SVG viewBox is roughly 12x12
    plusPathRaw.transform(plusTransform);
    plusPath = plusPathRaw;
  }

  // Reusable component for dynamic color masking with wave
  const WaveMasked = ({
    path,
    aboveColor,
    belowColor,
    clipPath,
  }: {
    path: any;
    aboveColor: string;
    belowColor: string;
    clipPath: any;
  }) => (
    <>
      {/* Above wave (normal color) */}
      <Path path={path} color={aboveColor} />
      {/* Under wave (masked color) */}
      <Group clip={clipPath?.value ? clipPath : undefined}>
        <Path path={path} color={belowColor} />
      </Group>
    </>
  );

  return (
    <Canvas
      style={{ width, height }}
    >
      {/* Dynamic greeting top left, above wave */}
      <Group>
        <Text
          x={greetingX}
          y={greetingY}
          text={greetingText}
          font={smallFont}
          color={colors.primary}
        />
        <Text
          x={greetingX + greetingTextWidth}
          y={greetingY}
          text={greetingName}
          font={boldSmallFont}
          color={colors.primary}
        />
        <Text
          x={greetingX + greetingTextWidth + greetingNameWidth}
          y={greetingY}
          text={greetingExcl}
          font={smallFont}
          color={colors.primary}
        />
      </Group>
      {/* Centered value and 'ml' above the wave */}
      <Group>
        <Text
          x={textTranslateX}
          y={fontSize}
          text={text}
          font={font}
          color={colors.primary}
          transform={textTransform}
        />
        <Text
          x={textTranslateX + valueTextWidth + mediumFontSize * 0.1}
          y={fontSize}
          text={mlText}
          font={mediumFont}
          color={colors.primary}
          transform={textTransform}
        />
        {/* 'Remaining: x ml' text */}
        <Text
          x={waterRemainingTranslateX}
          y={fontSize}
          text={waterRemainingText}
          font={smallFont}
          color={colors.primary}
          transform={waterRemainingTransform}
        />
      </Group>
      {/* Dynamic greeting inside wave, changes color */}
      <Group clip={clipPath}>
        {/* Gradient fill */}
        <Rect
          x={fillRectMargin}
          y={fillRectMargin}
          width={fillRectWidth}
          height={fillRectHeight}
        >
          <LinearGradient
            start={vec(0, Math.max(0, gradientStartY))}
            end={vec(0, Math.min(fillRectHeight, gradientEndY))}
            colors={["hsl(208, 92%, 62%)", "hsl(221, 91%, 58%)"]}
          />
        </Rect>
        {/* Dynamic greeting inside wave, on top of gradient fill */}
        <Text
          x={greetingX}
          y={greetingY}
          text={greetingText}
          font={smallFont}
          color={colors.background}
        />
        <Text
          x={greetingX + greetingTextWidth}
          y={greetingY}
          text={greetingName}
          font={boldSmallFont}
          color={colors.background}
        />
        <Text
          x={greetingX + greetingTextWidth + greetingNameWidth}
          y={greetingY}
          text={greetingExcl}
          font={smallFont}
          color={colors.background}
        />
        {/* Centered value and 'ml' under the wave */}
        <Text
          x={textTranslateX}
          y={fontSize}
          text={text}
          font={font}
          color={colors.background}
          transform={textTransform}
        />
        <Text
          x={textTranslateX + valueTextWidth + mediumFontSize * 0.1}
          y={fontSize}
          text={mlText}
          font={mediumFont}
          color={colors.background}
          transform={textTransform}
        />
        {/* Small 'good job' text under value, under the wave */}
        <Text
          x={waterRemainingTranslateX}
          y={fontSize}
          text={waterRemainingText}
          font={smallFont}
          color={colors.background}
          transform={waterRemainingTransform}
        />
      </Group>
      {/* Central SVG droplet button with dynamic color */}
      <WaveMasked
        path={dropletPath}
        aboveColor={colors.primary}
        belowColor={colors.background}
        clipPath={clipPath}
      />
      {/* Plus icon with dynamic color */}
      <WaveMasked
        path={plusPath}
        aboveColor={colors.background}
        belowColor={colors.primary}
        clipPath={clipPath}
      />
    </Canvas>
  );
};
