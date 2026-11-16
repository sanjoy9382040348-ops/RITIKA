import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Clock, Search as SearchIcon, X } from 'lucide-react-native';
import { providerRegistry } from '@providers/ProviderRegistry';
import { useDebounce } from '../../hooks/useDebounce';
import { SkeletonLoader } from '@components/SkeletonLoader';
import { TrackRow } from '@components/TrackRow';
import { palettes } from '@theme/tokens';
import { EraFilter, LanguageCode } from '../../types/music';
import { usePlayerStore } from '@store/playerStore';
import { useLibraryStore } from '@store/libraryStore';

const RECENT_KEY = 'ritika:recent_searches';
const GENRES = ['All', 'Synthpop', 'Indie Acoustic', 'Classic Melody', 'Lo-Fi'];

export const SearchScreen: React.FC<{ route?: any }> = ({ route }) => {
  const { t } = useTranslation();
  const colors = palettes.dark;

  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<'all' | LanguageCode>('all');
  const [era, setEra] = useState<EraFilter>('all');
  const [genre, setGenre] = useState<string>(route?.params?.initialGenre ?? 'All');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const debouncedQuery = useDebounce(query, 350);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const { isLiked, toggleLike } = useLibraryStore();

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then((raw) => {
      if (raw) setRecentSearches(JSON.parse(raw));
    });
  }, []);

  const saveRecentSearch = async (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const next = [clean, ...recentSearches.filter((s) => s !== clean)].slice(0, 8);
    setRecentSearches(next);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const hasActiveFilter = Boolean(debouncedQuery.trim()) || language !== 'all' || era !== 'all' || genre !== 'All';

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, language, era, genre],
    queryFn: async () => {
      const tracks = await providerRegistry.searchAll(debouncedQuery, {
        language,
        era,
        genre: genre === 'All' ? undefined : genre,
      });
      if (debouncedQuery.trim()) saveRecentSearch(debouncedQuery);
      return tracks;
    },
    enabled: hasActiveFilter,
  });

  const renderFilterChip = (label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? colors.accent : colors.surface, borderColor: active ? colors.accent : colors.border },
      ]}
    >
      <Text style={{ color: active ? '#FFF' : colors.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }]}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <X size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {(['all', 'en', 'hi', 'bn'] as const).map((l) =>
            renderFilterChip(l === 'all' ? 'All Langs' : l.toUpperCase(), language === l, () => setLanguage(l))
          )}
          {(['all', 'new', 'classic'] as const).map((e) =>
            renderFilterChip(e === 'all' ? 'All Eras' : e === 'classic' ? '60s–90s' : 'New', era === e, () => setEra(e))
          )}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {GENRES.map((g) => renderFilterChip(g, genre === g, () => setGenre(g)))}
        </ScrollView>

        {!hasActiveFilter ? (
          <View style={styles.recentWrap}>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('search.recent')}</Text>
              {recentSearches.length > 0 && (
                <Pressable
                  onPress={async () => {
                    setRecentSearches([]);
                    await AsyncStorage.removeItem(RECENT_KEY);
                  }}
                >
                  <Text style={{ color: colors.accent, fontSize: 13 }}>Clear</Text>
                </Pressable>
              )}
            </View>
            {recentSearches.map((term) => (
              <Pressable key={term} onPress={() => setQuery(term)} style={styles.recentItem}>
                <Clock size={16} color={colors.textMuted} />
                <Text style={{ color: colors.text, fontSize: 15, marginLeft: 10 }}>{term}</Text>
              </Pressable>
            ))}
          </View>
        ) : isLoading ? (
          <View style={{ gap: 12, marginTop: 12 }}>
            <SkeletonLoader width="100%" height={60} />
            <SkeletonLoader width="100%" height={60} />
            <SkeletonLoader width="100%" height={60} />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 110 }}
            renderItem={({ item }) => (
              <TrackRow
                track={item}
                isLiked={isLiked(item.id)}
                onPress={(tr) => playTrack(tr, results)}
                onToggleLike={toggleLike}
              />
            )}
            ListEmptyComponent={
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>
                No matching tracks found.
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 48, marginBottom: 12 },
  input: { flex: 1, marginLeft: 10, fontSize: 15 },
  filterRow: { flexGrow: 0, marginBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, marginRight: 8 },
  recentWrap: { marginTop: 14 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
});
