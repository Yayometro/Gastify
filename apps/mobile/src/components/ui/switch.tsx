import { Switch, useColorScheme } from 'react-native';

// The on/off switch in Gastify's purple (the system default is blue on Android).
export function GfSwitch({ value, onValueChange, accessibilityLabel }: { value: boolean; onValueChange: (next: boolean) => void; accessibilityLabel?: string }) {
  const dark = useColorScheme() === 'dark';
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ true: '#7e22ce', false: dark ? 'rgba(255,255,255,0.18)' : '#cfc8e0' }}
      thumbColor="#ffffff"
      ios_backgroundColor={dark ? 'rgba(255,255,255,0.18)' : '#cfc8e0'}
    />
  );
}
