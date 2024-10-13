import {
  Atlas,
  Canvas,
  Circle,
  SkPoint,
  SkRect,
  Skia,
  drawAsImage,
  rect,
} from '@shopify/react-native-skia';
import {StyleSheet, View} from 'react-native';
import {
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

const CIRCLE_RADIUS = 1;
const CIRCLE_SPEED = 1 / 16; // 1 point per 16 ms

const CIRCLE_COUNT = 1000;

const image = drawAsImage(
  <Circle cx={0} cy={0} r={CIRCLE_RADIUS} color={'white'} />,
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
      circles.value = Array.from({length: 1000}).map(
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

  const transforms = useDerivedValue(() => {
    return circles.value.map(circle => Skia.RSXform(1, 0, circle.x, circle.y));
  }, []);

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
