import {
  Atlas,
  Canvas,
  Circle,
  SkPoint,
  SkRect,
  Skia,
  drawAsImage,
  rect,
  useRSXformBuffer,
} from '@shopify/react-native-skia';
import {StyleSheet, View} from 'react-native';
import {
  useAnimatedReaction,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

const CIRCLE_RADIUS = 1;
const CIRCLE_SPEED = 1 / 16; // 1 point per 16 ms

const CIRCLE_COUNT = 1000;

const image = drawAsImage(
  <Circle
    cx={CIRCLE_RADIUS}
    cy={CIRCLE_RADIUS}
    r={CIRCLE_RADIUS}
    color={'white'}
  />,
  {
    width: 2 * CIRCLE_RADIUS,
    height: 2 * CIRCLE_RADIUS,
  },
);

const sprites = Array.from({length: CIRCLE_COUNT}).map(
  (): SkRect => rect(0, 0, CIRCLE_RADIUS * 2, CIRCLE_RADIUS * 2),
);

function getRandomNumber(min: number, max: number) {
  'worklet';
  return Math.random() * (max - min) + min;
}

function App() {
  const size = useSharedValue({width: 0, height: 0});

  const circles = useSharedValue<Array<{x: number; y: number}>>([]);

  useAnimatedReaction(
    () => size.value,
    currentSize => {
      circles.value = Array.from({length: CIRCLE_COUNT}).map(
        (): SkPoint => ({
          x: getRandomNumber(CIRCLE_RADIUS, currentSize.width - CIRCLE_RADIUS),
          y: getRandomNumber(CIRCLE_RADIUS, currentSize.height - CIRCLE_RADIUS),
        }),
      );
    },
  );

  useFrameCallback(info => {
    if (!info.timeSincePreviousFrame) return;
    const timeSincePreviousFrame = info.timeSincePreviousFrame;

    circles.modify(circles => {
      circles.forEach(circle => {
        circle.y += CIRCLE_SPEED * timeSincePreviousFrame;

        if (circle.y > size.value.height - CIRCLE_RADIUS) {
          circle.y = -CIRCLE_RADIUS;
          circle.x = getRandomNumber(
            CIRCLE_RADIUS,
            size.value.width - CIRCLE_RADIUS,
          );
        }
      });
      return circles;
    });
  });

  const transforms = useRSXformBuffer(CIRCLE_COUNT, (val, i) => {
    'worklet';
    const point = circles.value[i];
    if (!point) return;

    const form = Skia.RSXform(1, 0, point.x, point.y);
    val.set(form.scos, form.ssin, form.tx, form.ty);
  });

  return (
    <View style={styles.screen}>
      <Canvas onSize={size} style={styles.canvas}>
        <Atlas image={image} sprites={sprites} transforms={transforms} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  canvas: {
    flex: 1,
  },
});

export default App;
