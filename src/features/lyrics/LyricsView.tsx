import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@api/client';
import { getFontFamily, palettes } from '@theme/tokens';
import { Track } from '../../types/music';

export const ENABLE_LYRICS = true;

export const LyricsView: React.FC<{ track: Track }> = ({ track }) => {
  const colors = palettes.dark;

  const { data, isLoading } = useQuery({
    queryKey: ['lyrics', track.id],
    queryFn: () =>
      apiClient.get<{ lyrics: string | null; source?: string }>('/lyrics', {
        params: { title: track.title, artist: track.artist },
      }),
    enabled: ENABLE_LYRICS,
  });

  if (!ENABLE_LYRICS) return null;

  return (
    <View style={[styles.box, { backgroundColor: colors.surface }]}>
      {isLoading ? (
        <Text style={{ color: colors.textMuted }}>Loading lyrics...</Text>
      ) : data?.lyrics ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.lyrics, { color: colors.text, fontFamily: getFontFamily(track.language) }]}>
            {data.lyrics}
          </Text>
          {data.source && <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 12 }}>Source: {data.source}</Text>}
        </ScrollView>
      ) : (
        <Text style={{ color: colors.textMuted }}>Lyrics unavailable for this track.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: { flex: 1, borderRadius: 16, padding: 18, marginVertical: 12 },
  lyrics: { fontSize: 16, lineHeight: 26 },
});
