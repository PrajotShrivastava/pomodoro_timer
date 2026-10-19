import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, raisedShadow, space } from '@/theme/theme';

import { AppText } from './AppText';
import { IconButton } from './Buttons';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** A raised bottom sheet over a soft dimmed backdrop. */
export function Sheet({ visible, onClose, title, children }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: t.scheme === 'dark' ? 'rgba(10,12,16,0.55)' : 'rgba(43,54,72,0.25)',
          }}
        />
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: t.bg,
            borderTopLeftRadius: radius.lg + 6,
            borderTopRightRadius: radius.lg + 6,
            boxShadow: raisedShadow(t, 'lg'),
            paddingHorizontal: space.xl,
            paddingTop: space.lg,
            paddingBottom: insets.bottom + space.xl,
            width: '100%',
            maxWidth: 560,
            alignSelf: 'center',
            maxHeight: '85%',
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 5,
              borderRadius: 3,
              backgroundColor: t.divider,
              marginBottom: space.md,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.xl }}>
            <AppText variant="heading" style={{ flex: 1 }} accessibilityRole="header">
              {title}
            </AppText>
            <IconButton icon="close" size={36} onPress={onClose} accessibilityLabel="Close" />
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
