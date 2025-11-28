import { colors } from "@/constants/colors";
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
  // Rectangle dimensions
  // Width and Height come as props
  const borderThickness = 0;
  const fillRectMargin = borderThickness;
  const fillRectWidth = width - fillRectMargin * 2;
  const fillRectHeight = height - fillRectMargin * 2;

  const minValue = 0;
  const maxValue = 100;
  const fillPercent = Math.max(minValue, Math.min(maxValue, value)) / maxValue;

  // Wave parameters
  const waveCount = 1;
  const waveClipCount = waveCount + 1;
  const waveLength = fillRectWidth / waveCount;
  const waveClipWidth = waveLength * waveClipCount;
  const waveHeight = fillRectHeight * 0.05;

  // Font
  const fontSize = Math.min(width, height) / 5;
  const font = useFont(
    require("../assets/fonts/Poppins/Poppins-SemiBold.ttf"),
    fontSize
  );
  const textWidth = font?.getTextWidth(`${value}`) ?? 0;
  const textTranslateX = width / 2 - textWidth / 2;
  const textTranslateY = height / 2;
  const textTransform = [{ translateY: textTranslateY }];

  // Data for building the clip wave area for rectangle
  const data: Array<[number, number]> = [];
  for (let i = 0; i <= 40 * waveClipCount; i++) {
    data.push([i / (40 * waveClipCount), i / 40]);
  }

  const waveScaleX = scaleLinear().range([0, waveClipWidth]).domain([0, 1]);
  const waveScaleY = scaleLinear().range([0, waveHeight]).domain([0, 1]);

  // area for rectangle
  const clipArea = area()
    .x(function (d) {
      return waveScaleX(d[0]);
    })
    .y0(function (d) {
      return (
        fillRectHeight * (1 - fillPercent) +
        waveScaleY(Math.sin(d[1] * 2 * Math.PI))
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
    return `${textValue.value.toFixed(0)}ml`;
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

  const clipPath = useDerivedValue(() => {
    const clipP = Skia.Path.MakeFromSVGString(clipSvgPath);
    const transformMatrix = Skia.Matrix();
    transformMatrix.translate(
      fillRectMargin - waveLength * translateXAnimated.value,
      fillRectMargin
    );
    clipP.transform(transformMatrix);
    return clipP;
  }, [translateXAnimated, translateYPercent]);

  return (
    <Canvas style={{ width, height }}>
      <Rect
        x={borderThickness / 2}
        y={borderThickness / 2}
        width={width - borderThickness}
        height={height - borderThickness}
        color={colors.accent}
        style="stroke"
        strokeWidth={borderThickness}
      />

      {/* Text above the wave */}
      <Text
        x={textTranslateX}
        y={fontSize}
        text={text}
        font={font}
        color={colors.primary}
        transform={textTransform}
      />

      <Group clip={clipPath}>
        <Rect
          x={fillRectMargin}
          y={fillRectMargin}
          width={fillRectWidth}
          height={fillRectHeight}
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, fillRectHeight)}
            colors={["hsl(221, 91%, 58%)", "hsl(208, 92%, 62%)"]}
          />
        </Rect>
        {/* Text under the wave */}
        <Text
          x={textTranslateX}
          y={fontSize}
          text={text}
          font={font}
          color="#FFF"
          transform={textTransform}
        />
      </Group>
    </Canvas>
  );
};
