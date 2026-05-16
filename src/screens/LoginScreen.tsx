import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, setToken } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors, radii } from '../theme/colors';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const { login, refreshUser } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Заполните email и пароль');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Введите имя');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        const res = await api.register(email.trim(), password, name.trim(), gender ?? undefined);
        await setToken(res.token);
        await refreshUser();
      }
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>Padix</Text>
          <Text style={styles.tagline}>Падел-теннис · Американка</Text>
        </View>

        <Card style={{ padding: 24 }}>
          <Text style={styles.title}>
            {mode === 'login' ? 'Вход в аккаунт' : 'Создание аккаунта'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'login' ? 'Введите email и пароль' : 'Несколько шагов до игры'}
          </Text>

          <View style={styles.modeSwitch}>
            <ModeBtn label="Вход" active={mode === 'login'} onPress={() => setMode('login')} />
            <ModeBtn label="Регистрация" active={mode === 'register'} onPress={() => setMode('register')} />
          </View>

          {mode === 'register' && (
            <Input label="Имя" value={name} onChangeText={setName} placeholder="Иван" />
          )}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          {mode === 'register' && (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Пол</Text>
              <View style={styles.genderRow}>
                <GenderBtn label="М" active={gender === 'M'} onPress={() => setGender('M')} />
                <GenderBtn label="Ж" active={gender === 'F'} onPress={() => setGender('F')} />
                <GenderBtn label="Не указано" active={gender === null} onPress={() => setGender(null)} />
              </View>
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Button onPress={handleSubmit} loading={loading} fullWidth size="lg" style={{ marginTop: 8 }}>
            {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </Button>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ModeBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.modeBtn, active && styles.modeBtnActive]} onPress={onPress}>
      <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function GenderBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.genderBtn, active && styles.genderBtnActive]} onPress={onPress}>
      <Text style={[styles.genderBtnText, active && styles.genderBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logo: { color: colors.primary, fontSize: 42, fontWeight: '800', letterSpacing: -1 },
  tagline: { color: colors.textMuted, fontSize: 13, marginTop: 4 },

  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 18 },

  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: radii.md,
    padding: 3,
    marginBottom: 18,
  },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radii.sm },
  modeBtnActive: { backgroundColor: colors.bgCard },
  modeBtnText: { color: colors.textMuted, fontSize: 13 },
  modeBtnTextActive: { color: colors.text, fontWeight: '600' },

  fieldWrap: { marginBottom: 14 },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1,
    backgroundColor: 'rgba(54,54,54,0.3)',
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderBtnActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.10)' },
  genderBtnText: { color: colors.textMuted, fontSize: 13 },
  genderBtnTextActive: { color: colors.primary, fontWeight: '600' },

  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginBottom: 8 },
});
