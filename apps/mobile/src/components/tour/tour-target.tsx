import { useIsFocused } from 'expo-router';
import { useContext, useEffect, useRef, type ReactNode } from 'react';
import { Pressable, View, type HostInstance, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { InSheetContext } from '@/components/tour/tour-layer';
import { registerTarget, setScroller, type Scroller } from '@/components/tour/registry';

// Marks a control for the tutorial: returns the ref to put on its view. The control is registered only while its screen is the one
// on top, so a screen that stays mounted behind another (the tabs) never answers for it. `onTourPress` is what the card does when it
// asks the person to press the control ("Next" presses it for them).
export function useTourTarget(id?: string, onTourPress?: () => void) {
  const ref = useRef<HostInstance>(null);
  const press = useRef(onTourPress);
  useEffect(() => {
    press.current = onTourPress;
  }, [onTourPress]);
  const focused = useIsFocused();
  const inSheet = useContext(InSheetContext);
  useEffect(() => {
    if (!id || !focused) return;
    return registerTarget(id, { ref, onPress: () => press.current?.(), inSheet });
  }, [id, focused, inSheet]);
  return ref;
}

// Wraps something that cannot take a ref (a component of the app) so the tutorial can point at it. `collapsable={false}` keeps Android
// from removing the view, which would leave nothing to measure.
export function TourTarget({ id, onTourPress, style, className, children }: { id?: string; onTourPress?: () => void; style?: StyleProp<ViewStyle>; className?: string; children?: ReactNode }) {
  const ref = useTourTarget(id, onTourPress);
  return (
    <View ref={ref} collapsable={false} style={style} className={className}>
      {children}
    </View>
  );
}

// A screen tells the tutorial how to scroll it, while it is the one on top.
export function useTourScroller(scroller: Scroller) {
  const focused = useIsFocused();
  useEffect(() => {
    if (!focused) return;
    setScroller(scroller);
    return () => setScroller(null);
  }, [focused, scroller]);
}

// A button the tutorial can point at: a Pressable that registers itself under `id`.
export function TourPressable({ id, onPress, ...props }: PressableProps & { id?: string }) {
  const ref = useTourTarget(id, onPress ? () => onPress(undefined as never) : undefined);
  return <Pressable ref={ref} collapsable={false} onPress={onPress} {...props} />;
}
