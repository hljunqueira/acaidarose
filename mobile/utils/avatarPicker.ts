import { Alert, Platform } from 'react-native';

export interface PickedAvatar {
  base64: string;
  mimeType: string;
}

export async function pickAvatarFromLibrary(): Promise<PickedAvatar | null> {
  try {
    const ImagePicker = await import('expo-image-picker');

    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de acesso à tua galeria para escolheres uma foto de perfil.'
        );
        return null;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]?.base64) {
      return null;
    }

    const asset = result.assets[0];
    return {
      base64: asset.base64!,
      mimeType: asset.mimeType || 'image/jpeg',
    };
  } catch {
    Alert.alert(
      'Indisponível',
      'O seletor de imagens requer atualização da build nativa ou reinício do Metro.'
    );
    return null;
  }
}

export async function takeAvatarPhoto(): Promise<PickedAvatar | null> {
  if (Platform.OS === 'web') {
    return pickAvatarFromLibrary();
  }

  try {
    const ImagePicker = await import('expo-image-picker');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'Precisamos de acesso à câmara para tirares uma foto de perfil.'
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]?.base64) {
      return null;
    }

    const asset = result.assets[0];
    return {
      base64: asset.base64!,
      mimeType: asset.mimeType || 'image/jpeg',
    };
  } catch {
    Alert.alert(
      'Indisponível',
      'A câmara requer atualização da build nativa ou reinício do Metro.'
    );
    return null;
  }
}
