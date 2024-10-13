import {
  Canvas,
  Picture,
  SkPoint,
  Skia,
  createPicture,
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

  const picture = useDerivedValue(() => {
    return createPicture(canvas => {
      const paint = Skia.Paint();

      paint.setColor(Skia.Color('white'));

      circles.value.forEach(circle => {
        canvas.drawCircle(circle.x, circle.y, CIRCLE_RADIUS, paint);
      });
    });
  }, []);

  return (
    <View style={styles.screen}>
      <Canvas onSize={size} style={styles.canvas}>
        <Picture picture={picture} />
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
