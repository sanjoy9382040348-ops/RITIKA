import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react-native';
import { providerRegistry } from '@providers/ProviderRegistry';
import { SkeletonLoader } from '@components/SkeletonLoader';
import { TrackCard } from '@components/TrackCard';
import { getFontFamily, palettes } from '@theme/tokens';
import { LanguageCode, Track } from '../../types/music';
import { usePlayerStore } from '@store/playerStore';

type LangTab = 'all' | LanguageCode;

const MOODS_AND_GENRES = [
  { id: 'romantic', label: 'Romantic', color: '#7A2848' },
  { id: 'retro', label: '60s–90s Retro', color: '#5A3E1B' },
  { id: 'lofi', label: 'Lo-Fi & Chill', color: '#1F4A5C' },
  { id: 'indie', label: 'Indie Acoustic', color: '#2F4F3E' },
];

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const colors = palettes.dark;
  const [selectedLang, setSelectedLang] = useState<LangTab>('all');
  const playTrack = usePlayerStore((s) => s.playTrack);

  const { data: sections, isLoading } = useQuery({
    queryKey: ['home-sections', selectedLang],
    queryFn: () => providerRegistry.getBrowseSections(selectedLang),
    staleTime: 1000 * 60 * 5,
  });

  const handlePlay = (track: Track, list: Track[]) => {
    playTrack(track, list);
  };

  const langTabs: { key: LangTab; label: string }[] = [
    { key: 'all', label: t('home.all') },
    { key: 'en', label: t('home.english') },
    { key: 'hi', label: t('home.hindi') },
    { key: 'bn', label: t('home.bengali') },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text, fontFamily: getFontFamily(i18n.language, 'bold') }]}>
            {t('home.greeting')}
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={styles.iconBtn}
            hitSlop={12}
            accessibilityLabel="Open Settings"
          >
            <Settings color={colors.text} size={22} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
          {langTabs.map((tab) => {
            const active = selectedLang === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setSelectedLang(tab.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.accent : colors.surface,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? '#FFF' : colors.text }]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.section}>
            <SkeletonLoader width={160} height={22} style={{ marginBottom: 14 }} />
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <SkeletonLoader width={148} height={148} />
              <SkeletonLoader width={148} height={148} />
              <SkeletonLoader width={148} height={148} />
            </View>
          </View>
        ) : (
          sections?.map((section) => (
            <View key={section.id} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
              <FlatList
                horizontal
                data={section.items}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TrackCard track={item} onPress={(tr) => handlePlay(tr, section.items)} />
                )}
              />
            </View>
          ))
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.moodsGenres')}</Text>
          <View style={styles.moodGrid}>
            {MOODS_AND_GENRES.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => navigation.navigate('Search', { initialGenre: m.label })}
                style={[styles.moodCard, { backgroundColor: m.color }]}
              >
                <Text style={styles.moodText}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 16 },
  heading: { fontSize: 24 },
  iconBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  tabRow: { marginBottom: 22 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, borderWidth: 1, marginRight: 10, minHeight: 42, justifyContent: 'center' },
  chipText: { fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 26 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moodCard: { width: '48%', minHeight: 68, borderRadius: 14, padding: 14, justifyContent: 'flex-end' },
  moodText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
