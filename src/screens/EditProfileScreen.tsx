import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<string | null>(user?.gender ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const payload: any = {};
      if (name && name !== user?.name) payload.name = name.trim();
      if (email && email !== user?.email) payload.email = email.trim();
      if (password) payload.password = password;
      if (gender !== (user?.gender ?? null)) payload.gender = gender ?? '';
      await api.updateProfile(payload);
      await refreshUser();
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      <Field label="Имя" value={name} onChangeText={setName} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Field
        label="Новый пароль (оставьте пустым если не меняете)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />

      <Text style={styles.label}>Пол</Text>
      <View style={styles.row}>
        <GenderBtn label="М" active={gender === 'M'} onPress={() => setGender('M')} />
        <GenderBtn label="Ж" active={gender === 'F'} onPress={() => setGender('F')} />
        <GenderBtn label="Не указано" active={!gender} onPress={() => setGender(null)} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.submit, submitting && { opacity: 0.6 }]}
        onPress={save}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>Сохранить</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={styles.input} placeholderTextColor={colors.textDim} />
    </View>
  );
}

function GenderBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.gBtn, active && styles.gBtnActive]} onPress={onPress}>
      <Text style={[styles.gBtnText, active && styles.gBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  fieldWrap: { marginBottom: 14 },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    color: colors.text,
    fontSize: 15,
  },
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  gBtn: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gBtnActive: { borderColor: colors.primary },
  gBtnText: { color: colors.textMuted, fontSize: 13 },
  gBtnTextActive: { color: colors.primary, fontWeight: '600' },
  submit: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: { color: '#000', fontSize: 16, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: 12 },
});
