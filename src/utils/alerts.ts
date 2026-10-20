import { Alert, Platform } from 'react-native';

export function showMessage(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert([title, message].filter(Boolean).join('\n\n'));
    return;
  }
  Alert.alert(title, message);
}

export function confirmAction(options: {
  title: string;
  message?: string;
  confirmText: string;
  cancelText?: string;
  destructive?: boolean;
}): Promise<boolean> {
  const { title, message, confirmText, cancelText = 'Cancel', destructive = false } = options;

  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm([title, message].filter(Boolean).join('\n\n')));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}
