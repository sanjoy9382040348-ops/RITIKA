import { LanguageCode } from '../types/music';

export const palettes = {
  dark: {
    bg: '#0B0B0F',
    surface: '#15151D',
    surfaceElevated: '#1F1F2B',
    text: '#F5F5F7',
    textMuted: '#9B9BA7',
    accent: '#FF4D6D',
    accentSoft: 'rgba(255, 77, 109, 0.16)',
    border: '#272736',
    skeleton: '#232331',
  },
  light: {
    bg: '#F8F8FA',
    surface: '#FFFFFF',
    surfaceElevated: '#EFEFF4',
    text: '#121217',
    textMuted: '#636370',
    accent: '#E03356',
    accentSoft: 'rgba(224, 51, 86, 0.12)',
    border: '#E2E2EA',
    skeleton: '#E4E4EC',
  },
};

export function getFontFamily(lang: LanguageCode | string, weight: 'regular' | 'semibold' | 'bold' = 'regular') {
  if (lang === 'bn') {
    return weight === 'bold'
      ? 'NotoSansBengali_700Bold'
      : weight === 'semibold'
      ? 'NotoSansBengali_600SemiBold'
      : 'NotoSansBengali_400Regular';
  }
  if (lang === 'hi') {
    return weight === 'bold'
      ? 'NotoSansDevanagari_700Bold'
      : weight === 'semibold'
      ? 'NotoSansDevanagari_600SemiBold'
      : 'NotoSansDevanagari_400Regular';
  }
  return weight === 'bold'
    ? 'Inter_700Bold'
    : weight === 'semibold'
    ? 'Inter_600SemiBold'
    : 'Inter_400Regular';
}
