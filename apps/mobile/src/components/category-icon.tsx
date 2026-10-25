import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { getApiBaseUrl } from '@gastify/core/api/client';
import { fluentIconUrl, fluentSlugFor } from '@gastify/core/icons/fluentIcons';

// A category's icon, drawn the way the web app does: the stored name ("fluent/pizza", or an old
// react-icons name such as "gi/GiHamburger") becomes a Fluent Emoji 3D image served by the same
// site as the API; expo-image caches it on disk. A name with no Fluent equivalent (interface
// icons, brand logos, unknown) shows a generic category icon for now.
export function CategoryIcon({ name, size = 28 }: { name?: string | null; size?: number }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  // Fluent has no piggy bank: savings goals use the same Material icon the web does.
  if (name === 'md/MdSavings') return <MaterialIcons name="savings" size={Math.round(size * 0.9)} color="#ffffff" />;
  const slug = fluentSlugFor(name);

  if (!slug) {
    return <MaterialIcons name="category" size={Math.round(size * 0.85)} color={colors.textSecondary} />;
  }

  return (
    <Image
      source={{ uri: `${getApiBaseUrl()}${fluentIconUrl(slug)}` }}
      style={{ width: size, height: size }}
      contentFit="contain"
      cachePolicy="disk"
      accessibilityLabel={slug.replace(/-/g, ' ')}
    />
  );
}
