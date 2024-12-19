import { isIOS } from '@/lib/utils/platform';
import { Ionicons } from '@expo/vector-icons';
import { TouchableWithoutFeedback, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withSpring,
  WithSpringConfig,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAST_SPRING: WithSpringConfig = {
  mass: isIOS ? 1.25 : 0.75,
  damping: 150,
  stiffness: 900,
  restDisplacementThreshold: 0.01,
};

export const ImageViewHeader = ({
  showControl,
  onClose,
  onShare,
}: {
  showControl: SharedValue<boolean>;
  onClose?: () => void;
  onShare?: () => void;
}) => {
  const { top } = useSafeAreaInsets();

  const closeButtonStyle = useAnimatedStyle(() => {
    const showControlValue = showControl.get();

    return {
      opacity: withSpring(showControlValue ? 1 : 0, FAST_SPRING),
      transform: [{ translateY: withSpring(showControlValue ? 0 : -20, FAST_SPRING) }],
    };
  });

  return (
    <Animated.View
      className="absolute px-5 z-10 w-full flex-row justify-between"
      style={[closeButtonStyle, { top: top + 20 }]}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="bg-black/50 rounded-full p-2">
          <Ionicons name="close" size={24} color="white" />
        </View>
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPress={onShare}>
        <View className="bg-black/50 rounded-full p-2">
          <Ionicons name="share" size={24} color="white" />
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};
