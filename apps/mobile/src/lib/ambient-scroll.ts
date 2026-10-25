import { Animated } from 'react-native';

// How far the page on top has been scrolled, in points. The screens write it (see Screen) and the ambient background reads
// it, so the colours and shapes behind the page change as the person goes down a long page.
export const ambientScrollY = new Animated.Value(0);
