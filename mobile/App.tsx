import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { Wordmark } from '@/components/Wordmark';
import { XMark } from '@/components/XMark';
import { colors } from '@/theme/colors';

/**
 * Phase A1 — bare-bones entry screen.
 *
 * This file's job today: prove the build chain works on the user's
 * Android phone via Expo Go. Renders the brand wordmark, the X
 * monogram, and a "Phase A1" status block.
 *
 * Real flows (auth, navigation, role routing, home screens) land in
 * Phase A2 → A4. This file gets replaced by NavigationContainer +
 * RootNavigator at that point.
 */
export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Wordmark — the big TEAM PURE X lockup */}
        <View style={styles.heroBlock}>
          <Wordmark size={56} />
        </View>

        {/* Status callout — confirms Phase A1 is wired correctly */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <XMark size={20} />
            <Text style={styles.statusEyebrow}>Phase A1 · Foundation</Text>
          </View>
          <Text style={styles.statusTitle}>The app boots.</Text>
          <Text style={styles.statusBody}>
            You&apos;re reading this on Expo Go, scanned via QR from a dev
            machine. The brand assets, theming, and build chain are wired.
            Next:
          </Text>
          <View style={styles.checklist}>
            <ChecklistItem done text="Expo SDK + TypeScript + Metro bundler" />
            <ChecklistItem done text="Brand colours + Wordmark + XMark components" />
            <ChecklistItem done text="Android package id: com.teampurex.app" />
            <ChecklistItem text="Supabase auth + login screen (Phase A2)" />
            <ChecklistItem text="Splash + icon + biometric unlock (Phase A3)" />
            <ChecklistItem text="Role-based home screens (Phase A4)" />
          </View>
        </View>

        <Text style={styles.footer}>
          Tap any change in the dev console — this screen hot-reloads in
          under a second.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChecklistItem({ text, done }: { text: string; done?: boolean }) {
  return (
    <View style={styles.checkRow}>
      <View
        style={[
          styles.checkDot,
          { backgroundColor: done ? colors.accent : colors.borderSoft },
        ]}
      />
      <Text
        style={[
          styles.checkText,
          { color: done ? colors.text : colors.textMuted },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
  },
  heroBlock: {
    marginBottom: 32,
  },
  statusCard: {
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusEyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  statusTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  statusBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  checklist: {
    gap: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
});
