import { FONT_SIZES } from "@/constants/typography";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  Canvas,
  Group,
  LinearGradient,
  Path,
  Rect,
  Skia,
  Text,
  useFont,
  vec
} from "@shopify/react-native-skia";
import React, { useEffect, useMemo } from "react";
import {
  configureReanimatedLogger,
  Easing,
  ReanimatedLogLevel,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

type Props = {
  width: number;
  height: number;
  value: number;
  maxValue: number;
  userName: string;
  onDropletPress?: () => void;
};

export const getDropletPosition = (width: number, height: number) => {
  const dropletSize = Math.min(width, height) * 0.28;
  const dropletCenterX = width / 2;
  const dropletCenterY = height - dropletSize * 2.75;
  const dropletPositionX = dropletCenterX - dropletSize / 2;
  const dropletPositionY = dropletCenterY - dropletSize / 2;
  
  return {
    size: dropletSize,
    centerX: dropletCenterX,
    centerY: dropletCenterY,
    positionX: dropletPositionX,
    positionY: dropletPositionY,
  };
};

/**
 * Helper: build the SVG path string for a wave clip at a given fill fraction and phase.
 * This is a pure function so it can be called from within useDerivedValue on the UI thread.
 */
function buildWaveClipSvg(
  fillFraction: number,
  phase: number,
  waveClipCount: number,
  waveClipWidth: number,
  waveHeightMax: number,
  rectHeight: number,
  atEdge: boolean,
) {
  'worklet';
  const resolution = 40 * waveClipCount;
  const waveH = atEdge ? 0 : waveHeightMax;

  let path = "";
  for (let i = 0; i <= resolution; i++) {
    const xNorm = i / resolution;
    const x = xNorm * waveClipWidth;
    const sin = Math.sin((i / 40) * 2 * Math.PI + phase);
    const y = rectHeight * (1 - fillFraction) + (sin * waveH);
    path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  // close down to bottom-right, bottom-left, back to start
  path += ` L ${waveClipWidth} ${rectHeight + waveH}`;
  path += ` L 0 ${rectHeight + waveH}`;
  path += " Z";
  return path;
}

export const LiquidProgressGauge = ({ width, height, value, maxValue, userName, onDropletPress }: Props) => {
  const colors = useThemeColors();

  // Rectangle dimensions
  const fillRectMargin = 0;
  const fillRectWidth = width - fillRectMargin * 2;
  const fillRectHeight = height - fillRectMargin * 2;

  const minValue = 0;

  // Fonts
  const xlFontSize = FONT_SIZES.xl;
  const xlFont = useFont(
    require("@/assets/fonts/Poppins/Poppins-SemiBold.ttf"),
    xlFontSize
  );
  const mlTextFontSize = xlFontSize * 0.4;
  const mlTextFont = useFont(
    require("@/assets/fonts/Poppins/Poppins-Bold.ttf"),
    mlTextFontSize
  );
  const mdFontSize = FONT_SIZES.md;
  const mdFont = useFont(
    require("@/assets/fonts/Poppins/Poppins-Regular.ttf"),
    mdFontSize
  );
  const smFontSize = FONT_SIZES.sm;
  const smFont = useFont(
    require("@/assets/fonts/Poppins/Poppins-Regular.ttf"),
    smFontSize
  );
  const boldmdFont = useFont(
    require("@/assets/fonts/Poppins/Poppins-Bold.ttf"),
    mdFontSize
  );

  // Central SVG droplet button logic
  const { size: dropletSize, centerX: dropletCenterX, centerY: dropletCenterY } = getDropletPosition(width, height);
  // Feather droplet SVG path (36x36 viewBox)
  const dropletSvgPath =
    "M 18.00,4.04 C 18.00,4.04 26.49,12.52 26.49,12.52 28.66,14.70 30.01,17.70 30.01,21.01 30.01,27.64 24.63,33.01 18.01,33.01 11.38,33.01 6.01,27.64 6.01,21.01 6.01,17.70 7.35,14.70 9.52,12.53 9.52,12.53 18.00,4.04 18.00,4.04 Z";
  const dropletPath = useMemo(() => {
    const raw = Skia.Path.MakeFromSVGString(dropletSvgPath);
    if (!raw) return null;
    const m = Skia.Matrix();
    m.translate(dropletCenterX - dropletSize / 2, dropletCenterY - dropletSize / 2);
    m.scale(dropletSize / 36, dropletSize / 36);
    raw.transform(m);
    return raw;
  }, [dropletCenterX, dropletCenterY, dropletSize]);

  // Wave parameters (static geometry)
  const waveCount = 1;
  const waveClipCount = waveCount + 1;
  const waveLength = fillRectWidth / waveCount;
  const waveClipWidth = waveLength * waveClipCount;
  const waveHeightMax = fillRectHeight * 0.03;

  // Dynamic greeting text position and font
  const greetingText = "Hello  ";
  const greetingName = userName;
  const greetingExcl = " !";
  const greetingTextWidth = mdFont?.getTextWidth(greetingText) ?? 0;
  const greetingNameWidth = boldmdFont?.getTextWidth(greetingName) ?? 0;
  const greetingX = 25;
  const greetingY = 120;

  const mlText = "ml";
  const mlTextWidth = mlTextFont?.getTextWidth(mlText) ?? 0;
  const textTranslateY = height / 4;
  const textTransform = [{ translateY: textTranslateY }];
  const waterRemainingTranslateY = textTranslateY + xlFontSize * 0.4;
  const waterRemainingTransform = [{ translateY: waterRemainingTranslateY }];

  // ── Animated shared values ──────────────────────────────────────
  // Wave phase (continuous loop)
  const wavePhase = useSharedValue(0);
  useEffect(() => {
    wavePhase.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.linear }),
      -1
    );
  }, []);

  // Animated fill percent (smoothly transitions when value/maxValue change)
  const animatedFillPercent = useSharedValue(
    Math.max(minValue, Math.min(maxValue, value)) / maxValue
  );
  useEffect(() => {
    const target = Math.max(minValue, Math.min(maxValue, value)) / maxValue;
    animatedFillPercent.value = withTiming(target, { duration: 2000 });
  }, [value, maxValue]);

  // Animated text value (counts up/down)
  const textValue = useSharedValue(value);
  useEffect(() => {
    textValue.value = withTiming(value, { duration: 1000 });
  }, [value]);

  // Derived: displayed text string
  const text = useDerivedValue(() => {
    return `${textValue.value.toFixed(0)}`;
  }, [textValue]);

  // Derived: "Remaining" text
  const waterRemainingText = useDerivedValue(() => {
    const remaining = maxValue - textValue.value;
    if (remaining <= 0) return "Goal achieved!";
    return `Remaining: ${Math.round(remaining)}ml`;
  }, [textValue, maxValue]);

  // Derived: x-position of the value text (keeps it centred as digits change)
  const textTranslateX = useDerivedValue(() => {
    if (!xlFont || !mlTextFont) return width / 2;
    const valWidth = xlFont.getTextWidth(text.value);
    const total = valWidth + mlTextWidth + xlFontSize * 0.1;
    return width / 2 - total / 2;
  }, [text, xlFont, mlTextFont, width, mlTextWidth, xlFontSize]);

  // Derived: x-position for "ml" label (sits right of value text)
  const mlTextX = useDerivedValue(() => {
    if (!xlFont) return 0;
    const valWidth = xlFont.getTextWidth(text.value);
    return textTranslateX.value + valWidth + mlTextFontSize * 0.1;
  }, [text, textTranslateX, xlFont, mlTextFontSize]);

  // Derived: x-position for remaining text (centred)
  const waterRemainingTranslateX = useDerivedValue(() => {
    if (!smFont) return width / 2;
    const w = smFont.getTextWidth(waterRemainingText.value);
    return width / 2 - w / 2;
  }, [waterRemainingText, smFont, width]);

  // Derived: Gradient vectors (start at wave height, end at bottom)
  const gradientStart = useDerivedValue(() => {
    const startY = fillRectHeight * (1 - animatedFillPercent.value);
    return vec(0, startY);
  }, [animatedFillPercent, fillRectHeight]);

  const gradientEnd = useDerivedValue(() => {
    return vec(0, fillRectHeight);
  }, [fillRectHeight]);

  // ── Animated clip path (wave + fill height) ─────────────────────
  const clipPath = useDerivedValue(() => {
    const frac = animatedFillPercent.value;
    const atEdge = frac <= 0 || frac >= 1;
    const phase = (wavePhase.value % 1) * 2 * Math.PI;
    const svgStr = buildWaveClipSvg(
      frac,
      phase,
      waveClipCount,
      waveClipWidth,
      waveHeightMax,
      fillRectHeight,
      atEdge,
    );
    const p = Skia.Path.MakeFromSVGString(svgStr);
    if (!p) return undefined;
    const m = Skia.Matrix();
    m.translate(fillRectMargin - waveLength * wavePhase.value, fillRectMargin);
    p.transform(m);
    return p;
  }, [wavePhase, animatedFillPercent]);

  // Plus icon SVG path (centered in droplet, visually pixel-perfect)
  const plusSize = dropletSize * 0.2;
  const plusCenterX = width / 2 - plusSize / 2;
  const plusCenterY = dropletCenterY - plusSize * 0.9;
  const plusSvgPath =
    "M 18 17.5 a 1.2 1.2 0 0 1 1.2 1.2 v 2.8 h 2.8 a 1.2 1.2 0 0 1 0 2.4 h -2.8 v 2.8 a 1.2 1.2 0 0 1 -2.4 0 v -2.8 h -2.8 a 1.2 1.2 0 0 1 0 -2.4 h 2.8 v -2.8 a 1.2 1.2 0 0 1 1.2 -1.2 Z";
  const plusPath = useMemo(() => {
    const raw = Skia.Path.MakeFromSVGString(plusSvgPath);
    if (!raw) return null;
    const m = Skia.Matrix();
    m.translate(plusCenterX - plusSize, plusCenterY - plusSize / 2);
    m.scale(plusSize / 12, plusSize / 12);
    raw.transform(m);
    return raw;
  }, [plusCenterX, plusCenterY, plusSize]);

  // ── Sub-components ──────────────────────────────────────────────
  const WaveMasked = React.memo(({ path, aboveColor, belowColor, clipPath }: {
    path: any;
    aboveColor: string;
    belowColor: string;
    clipPath: any;
  }) => {
    return (
      <>
        <Path path={path} color={aboveColor} />
        <Group clip={clipPath}>
          <Path path={path} color={belowColor} />
        </Group>
      </>
    );
  });

  function GaugeGreeting({
    greetingX,
    greetingY,
    greetingText,
    greetingTextWidth,
    greetingName,
    greetingNameWidth,
    greetingExcl,
    mdFont,
    boldmdFont,
    color,
  }: any) {
    return (
      <>
        <Text
          x={greetingX}
          y={greetingY}
          text={greetingText}
          font={mdFont}
          color={color}
        />
        <Text
          x={greetingX + greetingTextWidth}
          y={greetingY}
          text={greetingName}
          font={boldmdFont}
          color={color}
        />
        <Text
          x={greetingX + greetingTextWidth + greetingNameWidth}
          y={greetingY}
          text={greetingExcl}
          font={mdFont}
          color={color}
        />
      </>
    );
  }

  function GaugeText({
    textTranslateX,
    xlFontSize,
    text,
    mlTextX,
    mlText,
    mlTextFont,
    textTransform,
    waterRemainingTranslateX,
    waterRemainingText,
    waterRemainingTransform,
    xlFont,
    smFont,
    color,
  }: any) {
    return (
      <>
        {/* Centered value and 'ml' */}
        <Text
          x={textTranslateX}
          y={xlFontSize}
          text={text}
          font={xlFont}
          color={color}
          transform={textTransform}
        />
        <Text
          x={mlTextX}
          y={xlFontSize}
          text={mlText}
          font={mlTextFont}
          color={color}
          transform={textTransform}
        />
        {/* Remaining text */}
        <Text
          x={waterRemainingTranslateX}
          y={xlFontSize}
          text={waterRemainingText}
          font={smFont}
          color={color}
          transform={waterRemainingTransform}
        />
      </>
    );
  }

  function GaugeDroplet({
    dropletPath,
    colors,
    clipPath,
    plusPath,
  }: any) {
    return (
      <>
        <WaveMasked
          path={dropletPath}
          aboveColor={colors.primary}
          belowColor={colors.background}
          clipPath={clipPath}
        />
        <WaveMasked
          path={plusPath}
          aboveColor={colors.background}
          belowColor={colors.primary}
          clipPath={clipPath}
        />
      </>
    );
  }

  // Don't render until all fonts are loaded to prevent invisible text
  if (!xlFont || !mlTextFont || !mdFont || !smFont || !boldmdFont) {
    return null;
  }

  return (
    <Canvas style={{ width, height }}>
      {/* Text and greeting above wave */}
      <Group>
        <GaugeGreeting
          greetingX={greetingX}
          greetingY={greetingY}
          greetingText={greetingText}
          greetingTextWidth={greetingTextWidth}
          greetingName={greetingName}
          greetingNameWidth={greetingNameWidth}
          greetingExcl={greetingExcl}
          mdFont={mdFont}
          boldmdFont={boldmdFont}
          color={colors.primary}
        />
        <GaugeText
          textTranslateX={textTranslateX}
          xlFontSize={xlFontSize}
          text={text}
          mlTextX={mlTextX}
          mlText={mlText}
          mlTextFont={mlTextFont}
          textTransform={textTransform}
          waterRemainingTranslateX={waterRemainingTranslateX}
          waterRemainingText={waterRemainingText}
          waterRemainingTransform={waterRemainingTransform}
          xlFont={xlFont}
          smFont={smFont}
          color={colors.primary}
        />
      </Group>
      {/* Gradient and clipped text inside wave */}
      <Group clip={clipPath}>
        <Rect
          x={fillRectMargin}
          y={fillRectMargin}
          width={fillRectWidth}
          height={fillRectHeight}
        >
          <LinearGradient
            start={gradientStart}
            end={gradientEnd}
            colors={["hsl(221, 91%, 58%)", "hsl(208, 92%, 62%)"]}
          />
        </Rect>
        <GaugeGreeting
          greetingX={greetingX}
          greetingY={greetingY}
          greetingText={greetingText}
          greetingTextWidth={greetingTextWidth}
          greetingName={greetingName}
          greetingNameWidth={greetingNameWidth}
          greetingExcl={greetingExcl}
          mdFont={mdFont}
          boldmdFont={boldmdFont}
          color={colors.background}
        />
        <GaugeText
          textTranslateX={textTranslateX}
          xlFontSize={xlFontSize}
          text={text}
          mlTextX={mlTextX}
          mlText={mlText}
          mlTextFont={mlTextFont}
          textTransform={textTransform}
          waterRemainingTranslateX={waterRemainingTranslateX}
          waterRemainingText={waterRemainingText}
          waterRemainingTransform={waterRemainingTransform}
          xlFont={xlFont}
          smFont={smFont}
          color={colors.background}
        />
      </Group>
      {/* Droplet and plus icon, clipped by wave */}
      <GaugeDroplet
        dropletPath={dropletPath}
        colors={colors}
        clipPath={clipPath}
        plusPath={plusPath}
      />
    </Canvas>
  );
};
