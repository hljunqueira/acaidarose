import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ArrowRight } from 'lucide-react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { api, resolveMediaUrl } from '@/services/api';
import { Colors } from '@/constants/Colors';

interface PresentationSceneConfig {
  index: number;
  title: string;
  subtitle: string;
  video_url: string | null;
  title_font?: string;
  title_size?: number;
  title_color?: string;
  subtitle_font?: string;
  subtitle_size?: number;
  subtitle_color?: string;
}

function resolveNativeFontFamily(fontKey?: string): string | undefined {
  if (fontKey === 'serif') return Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
  if (fontKey === 'mono') return Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });
  if (fontKey === 'rounded') return Platform.select({ ios: 'Avenir Next', android: 'sans-serif-medium', default: undefined });
  return undefined;
}

const VIDEO_SOURCES = [
  require('@/assets/hero_revealing_cup.mp4'),
  require('@/assets/hero_orbiting_cup.mp4'),
  require('@/assets/hero_gliding_texture.mp4'),
  require('@/assets/hero_cup_rotation.mp4'),
];

export default function SplashScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { isAuthenticated, isLoading } = useAuth();
  const scrollViewRef = useRef<any>(null);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  const { data: customScenes } = useQuery({
    queryKey: ['loyalty_presentation_scenes'],
    queryFn: async () => {
      const res = await api.get('/api/loyalty/settings');
      const list = res.data?.presentation?.scenes;
      return Array.isArray(list) ? (list as PresentationSceneConfig[]) : [];
    },
    staleTime: 1000 * 60,
  });

  const activeScenes = useMemo(() => {
    const defaultFallbacks = [
      { title: t('onboardingScene1Title'), subtitle: t('onboardingScene1Sub') },
      { title: t('onboardingScene2Title'), subtitle: t('onboardingScene2Sub') },
      { title: t('onboardingScene3Title'), subtitle: t('onboardingScene3Sub') },
      { title: t('onboardingScene4Title'), subtitle: t('onboardingScene4Sub') },
    ];

    const sourceList: Array<PresentationSceneConfig | null> =
      customScenes && customScenes.length > 0 ? customScenes : [null, null, null, null];

    return sourceList.map((custom, idx) => {
      const fb = defaultFallbacks[idx % defaultFallbacks.length];
      const titleStyle: any = {};
      if (custom?.title_font) {
        const ff = resolveNativeFontFamily(custom.title_font);
        if (ff) titleStyle.fontFamily = ff;
      }
      if (custom?.title_size && Number.isFinite(Number(custom.title_size))) {
        titleStyle.fontSize = Number(custom.title_size);
        titleStyle.lineHeight = Math.round(Number(custom.title_size) * 1.12);
      }
      if (custom?.title_color) {
        titleStyle.color = custom.title_color;
      }

      const subtitleStyle: any = {};
      if (custom?.subtitle_font) {
        const ff = resolveNativeFontFamily(custom.subtitle_font);
        if (ff) subtitleStyle.fontFamily = ff;
      }
      if (custom?.subtitle_size && Number.isFinite(Number(custom.subtitle_size))) {
        subtitleStyle.fontSize = Number(custom.subtitle_size);
        subtitleStyle.lineHeight = Math.round(Number(custom.subtitle_size) * 1.4);
      }
      if (custom?.subtitle_color) {
        subtitleStyle.color = custom.subtitle_color;
      }

      const customUrl = resolveMediaUrl(custom?.video_url);
      const videoSource = customUrl
        ? { uri: customUrl }
        : idx < VIDEO_SOURCES.length
          ? VIDEO_SOURCES[idx]
          : null;

      return {
        key: `scene-${idx}`,
        title: custom ? custom.title?.trim() || '' : fb.title,
        subtitle: custom ? custom.subtitle?.trim() || '' : fb.subtitle,
        titleStyle,
        subtitleStyle,
        videoSource,
      };
    });
  }, [customScenes, t]);

  const player = useVideoPlayer(VIDEO_SOURCES[0], (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    const safeIdx = Math.min(activeSceneIndex, Math.max(0, activeScenes.length - 1));
    const targetSource = activeScenes[safeIdx]?.videoSource;
    if (!targetSource) return;
    try {
      player.replace(targetSource);
      player.play();
    } catch { }
  }, [activeScenes, activeSceneIndex, player]);

  useFocusEffect(
    useCallback(() => {
      try {
        player.play();
      } catch { }
      return () => {
        try {
          player.pause();
        } catch { }
      };
    }, [player])
  );

  // Redireciona automaticamente utilizadores já autenticados para a Home
  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const index = Math.min(
      Math.max(Math.round(scrollY / Math.max(screenHeight, 1)), 0),
      Math.max(0, activeScenes.length - 1)
    );

    if (index !== activeSceneIndex) {
      setActiveSceneIndex(index);
    }
  };

  const scrollToScene = (targetIndex: number) => {
    scrollViewRef.current?.scrollTo({
      y: targetIndex * screenHeight,
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Camada Fixa de Vídeo Full-Bleed */}
      <View style={StyleSheet.absoluteFill}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
        <View style={styles.vignetteOverlay} />
      </View>

      {/* Topo Fixo com Logo */}
      <SafeAreaView style={styles.fixedHeader} edges={['top']} pointerEvents="box-none">
        <View style={styles.headerRow} pointerEvents="box-none">
          <View style={styles.headerSpacer} />

          <View style={styles.logoGlassContainer}>
            <BlurView intensity={65} tint="dark" style={styles.logoGlassCard}>
              <Image
                source={require('@/assets/logo.png')}
                style={styles.headerLogo}
                contentFit="contain"
              />
              <View style={styles.cashbackBadge}>
                <Text style={styles.cashbackBadgeText}>CASHBACK</Text>
              </View>
            </BlurView>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      {/* Indicador Vertical de Progresso das Cenas */}
      <View style={styles.dotsColumn} pointerEvents="box-none">
        {activeScenes.map((scene, idx) => (
          <TouchableOpacity
            key={scene.key}
            onPress={() => scrollToScene(idx)}
            hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
          >
            <View
              style={[
                styles.sceneDot,
                activeSceneIndex === idx && styles.sceneDotActive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Scroll Vertical Dinâmico das Cenas */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        pagingEnabled
        snapToInterval={screenHeight}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {activeScenes.map((scene, idx) => {
          const isLeft = idx % 2 === 0;
          const isLast = idx === activeScenes.length - 1;
          const defaultTitleStyle =
            idx === 0
              ? styles.sceneTitleWhite
              : idx % 2 === 1
                ? styles.sceneTitlePink
                : styles.sceneTitlePurple;

          return (
            <View
              key={scene.key}
              style={[styles.sceneContainer, { width: screenWidth, height: screenHeight }]}
            >
              <View
                style={[
                  isLeft ? styles.leftContentBlock : styles.rightContentBlock,
                  { maxWidth: screenWidth * 0.82 },
                ]}
              >
                <Text style={[defaultTitleStyle, scene.titleStyle]}>{scene.title}</Text>
                <Text
                  style={[
                    isLeft ? styles.sceneSubtitle : styles.sceneSubtitleRight,
                    scene.subtitleStyle,
                  ]}
                >
                  {scene.subtitle}
                </Text>
              </View>

              {isLast ? (
                <View style={styles.actionContainer}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/(auth)/login')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryButtonText}>{t('onboardingLoginBtn')}</Text>
                    <ArrowRight size={18} color={Colors.textInverse} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.push('/(auth)/registo')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.secondaryButtonText}>{t('onboardingRegisterBtn')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.scrollPrompt}
                  onPress={() => scrollToScene(idx + 1)}
                  activeOpacity={0.8}
                >
                  {idx === 0 ? (
                    <Text style={styles.scrollPromptText}>{t('onboardingScrollDown')}</Text>
                  ) : null}
                  <ChevronDown size={22} color={idx % 2 === 0 ? '#E879F9' : '#F472B6'} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#11011c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#11011c',
  },
  vignetteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 1, 28, 0.58)',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 68,
  },
  skipCol: {
    width: 68,
    alignItems: 'flex-end',
    paddingTop: 6,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logoGlassContainer: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.75,
    shadowRadius: 18,
    elevation: 8,
  },
  logoGlassCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 8,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
  },
  headerLogo: {
    width: 126,
    height: 92,
  },
  cashbackBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderColor: 'rgba(212, 175, 55, 0.55)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: -2,
  },
  cashbackBadgeText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  dotsColumn: {
    position: 'absolute',
    right: 12,
    top: '46%',
    zIndex: 35,
    gap: 8,
    alignItems: 'center',
  },
  sceneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  sceneDotActive: {
    height: 18,
    backgroundColor: Colors.gold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sceneContainer: {
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 130,
    paddingBottom: 40,
  },
  leftContentBlock: {
    alignItems: 'flex-start',
  },
  rightContentBlock: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
  },
  sceneTitleWhite: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 44,
    letterSpacing: -0.5,
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 18,
  },
  sceneTitlePink: {
    color: '#F472B6',
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 44,
    letterSpacing: -0.5,
    textAlign: 'right',
    textShadowColor: 'rgba(236, 72, 153, 0.65)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  sceneTitlePurple: {
    color: '#E879F9',
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 44,
    letterSpacing: -0.5,
    textAlign: 'left',
    textShadowColor: 'rgba(217, 70, 239, 0.65)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  sceneSubtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'left',
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  sceneSubtitleRight: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'right',
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  scrollPrompt: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 4,
  },
  scrollPromptText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  actionContainer: {
    width: '100%',
    gap: 12,
    marginTop: 32,
  },
  primaryButton: {
    height: 52,
    backgroundColor: Colors.brandDeep,
    borderColor: Colors.gold,
    borderWidth: 1.5,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
});
