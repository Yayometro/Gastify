import { View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';

// The round badge behind a movement's or a budget's icon: the category's color with its icon inside.
export function CategoryBadge({
  icon,
  color,
  size = 46,
}: {
  icon?: string | null;
  color?: string | null;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color || '#DADADA',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <CategoryIcon name={icon} size={Math.round(size * 0.6)} />
    </View>
  );
}
