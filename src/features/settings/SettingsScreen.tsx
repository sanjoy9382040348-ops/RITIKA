import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';
import { useSettingsStore } from '@store/settingsStore';
import { useAuthStore } from '@store/authStore';
import { palettes } from '@theme/tokens';
import { LanguageCode } from '../../types/music';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { appLanguage, audioQuality, dataSaver, theme, setLanguage, setAudioQuality, toggleDataSaver, toggleTheme } =
    useSettingsStore();
  const { user, isGuest, signInWithGoogle, signOut } = useAuthStore();
  const colors = palettes[theme];

  const handleLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.heading, { color: colors.text }]}>{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.text }]}>
            {isGuest ? 'Guest Mode (Local Library)' : `Signed in as ${user?.name}`}
          </Text>
          <Pressable
            onPress={isGuest ? signInWithGoogle : signOut}
            style={[styles.authBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={{ color: '#FFF', fontWeight: '700' }}>
              {isGuest ? 'Sign in with Google to Sync' : 'Sign Out'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.text }]}>{t('settings.language')}</Text>
          <View style={styles.row}>
            {(['en', 'hi', 'bn'] as LanguageCode[]).map((lang) => (
              <Pressable
                key={lang}
                onPress={() => handleLanguage(lang)}
                style={[styles.pill, { backgroundColor: appLanguage === lang ? colors.accent : colors.surfaceElevated }]}
              >
                <Text style={{ color: appLanguage === lang ? '#FFF' : colors.text, fontWeight: '600' }}>
                  {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'বাংলা'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.text }]}>{t('settings.quality')}</Text>
          <View style={styles.row}>
            {(['low', 'normal', 'high'] as const).map((q) => (
              <Pressable
                key={q}
                onPress={() => setAudioQuality(q)}
                style={[styles.pill, { backgroundColor: audioQuality === q ? colors.accent : colors.surfaceElevated }]}
              >
                <Text style={{ color: audioQuality === q ? '#FFF' : colors.text, textTransform: 'capitalize' }}>{q}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, styles.switchRow, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>{t('settings.dataSaver')}</Text>
          <Switch value={dataSaver} onValueChange={toggleDataSaver} />
        </View>

        <View style={[styles.card, styles.switchRow, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Dark Theme</Text>
          <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 22, fontWeight: '700' },
  scroll: { padding: 16, gap: 14 },
  card: { padding: 16, borderRadius: 14 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  authBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
});
