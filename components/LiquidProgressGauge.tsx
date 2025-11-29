import { useThemeColors } from "@/hooks/useThemeColors";
import {
  Canvas,
  Group,
  LinearGradient,
  Rect,
  Skia,
  Text,
  useFont,
  vec,
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
};

export const LiquidProgressGauge = ({ width, height, value }: Props) => {

  const colors = useThemeColors();

  // Rectangle dimensions
  // Width and Height come as props
  // const borderThickness = 0;  --optional
  const fillRectMargin = 0;   // --set to borderThickness
  const fillRectWidth = width - fillRectMargin * 2;
  const fillRectHeight = height - fillRectMargin * 2;

  const minValue = 0;
  const maxValue = 2400;
  const fillPercent = Math.max(minValue, Math.min(maxValue, value)) / maxValue;

  // Wave parameters
  const waveCount = 1;
  const waveClipCount = waveCount + 1;
  const waveLength = fillRectWidth / waveCount;
  const waveClipWidth = waveLength * waveClipCount;
  const waveHeight = (value >= maxValue) ? 0 : fillRectHeight * 0.03; // flatten out wave at top height

  // Font
  const fontSize = Math.min(width, height) / 5;
  const font = useFont(
    require("../assets/fonts/Poppins/Poppins-SemiBold.ttf"),
    fontSize
  );
  const smallFontSize = fontSize * 0.2;
  const smallFont = useFont(
    require("../assets/fonts/Poppins/Poppins-Medium.ttf"),
    smallFontSize
  );
  // Value text and 'ml' text width
  const valueText = `${value}`;
  const mlText = "ml";
  const valueTextWidth = font?.getTextWidth(valueText) ?? 0;
  const mlTextWidth = font?.getTextWidth(mlText) ?? 0;
  const totalTextWidth = valueTextWidth + mlTextWidth + fontSize * 0.2; // spacing
  const textTranslateX = width / 2 - totalTextWidth / 2;
  const textTranslateY = height / 4;
  const textTransform = [{ translateY: textTranslateY }];
  // x ml remaining text
  const goodJobText = `Remaining: ${maxValue - value}ml`;
  const goodJobTextWidth = smallFont?.getTextWidth(goodJobText) ?? 0;
  const goodJobTranslateX = width / 2 - goodJobTextWidth / 2;
  const goodJobTranslateY = textTranslateY + fontSize * 0.4;
  const goodJobTransform = [{ translateY: goodJobTranslateY }];

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
    .x(function (d) {
      return waveScaleX(d[0]);
    })
    .y0(function (d) {
      // Use phase for seamless animation
      const phase = (wavePhase.value % 1) * 2 * Math.PI;
      return (
        fillRectHeight * (1 - fillPercent) +
        waveScaleY(Math.sin(d[1] * 2 * Math.PI + phase))
      );
    })
    .y1(function (_d) {
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
    const clipP = Skia.Path.MakeFromSVGString(clipSvgPath);
    const transformMatrix = Skia.Matrix();
    transformMatrix.translate(
      fillRectMargin - waveLength * wavePhase.value,
      fillRectMargin
    );
    clipP.transform(transformMatrix);
    return clipP;
  }, [wavePhase, waveFillHeightAnimated]);

  return (
    <Canvas style={{ width, height }}>
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
          x={textTranslateX + valueTextWidth + fontSize * 0.2}
          y={fontSize}
          text={mlText}
          font={font}
          color={colors.primary}
          transform={textTransform}
        />
        {/* Small 'good job' text under value */}
        <Text
          x={goodJobTranslateX}
          y={fontSize}
          text={goodJobText}
          font={smallFont}
          color={colors.primary}
          transform={goodJobTransform}
        />
      </Group>
      <Group clip={clipPath}>
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
        {/* Centered value and 'ml' under the wave */}
        <Text
          x={textTranslateX}
          y={fontSize}
          text={text}
          font={font}
          color={colors.white}
          transform={textTransform}
        />
        <Text
          x={textTranslateX + valueTextWidth + fontSize * 0.2}
          y={fontSize}
          text={mlText}
          font={font}
          color={colors.white}
          transform={textTransform}
        />
        {/* Small 'good job' text under value, under the wave */}
        <Text
          x={goodJobTranslateX}
          y={fontSize}
          text={goodJobText}
          font={smallFont}
          color={colors.white}
          transform={goodJobTransform}
        />
      </Group>
    </Canvas>
  );
};
