import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { SurveyDef } from '../api/types';
import { colors } from '../theme/colors';

export default function SurveyScreen() {
  const { refreshUser } = useAuth();
  const [def, setDef] = useState<SurveyDef | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingDef, setLoadingDef] = useState(true);

  useEffect(() => {
    api.getSurvey()
      .then((d) => {
        setDef(d);
        const initial: Record<string, string> = {};
        d.questions.forEach((q) => { initial[q.id] = ''; });
        setAnswers(initial);
      })
      .catch((e) => setError(e?.message ?? 'Не удалось загрузить тест'))
      .finally(() => setLoadingDef(false));
  }, []);

  const questions = def?.questions ?? [];
  const totalSteps = questions.length;
  const currentQuestion = questions[step] ?? null;
  const canNext = !!(currentQuestion && answers[currentQuestion.id]);
  const isLast = step === totalSteps - 1;
  const readyToSubmit = useMemo(
    () => questions.every((q) => !!answers[q.id]),
    [questions, answers],
  );

  const submit = async () => {
    if (!def) return;
    setLoading(true);
    setError(null);
    try {
      await api.submitSurvey({ version: def.version, answers });
      await refreshUser();
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (loadingDef) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!def) {
    return <View style={styles.center}><Text style={styles.error}>{error ?? 'Тест недоступен'}</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: totalSteps > 1 ? `${(step / (totalSteps - 1)) * 100}%` : '0%' },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.title}>Предварительный рейтинг</Text>
        <Text style={styles.subtitle}>
          Ответьте на несколько вопросов — это нужно один раз, чтобы подобрать стартовый рейтинг.
        </Text>

        {currentQuestion && (
          <View style={styles.card}>
            <Text style={styles.stepInfo}>Вопрос {step + 1} из {totalSteps}</Text>
            <Text style={styles.qTitle}>{currentQuestion.title}</Text>
            <View style={{ marginTop: 12 }}>
              {currentQuestion.options.map((opt) => {
                const active = answers[currentQuestion.id] === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => setAnswers((p) => ({ ...p, [currentQuestion.id]: opt.id }))}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.nav}>
          <TouchableOpacity
            style={[styles.navBtn, step === 0 && { opacity: 0.4 }]}
            onPress={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <Text style={styles.navBtnText}>Назад</Text>
          </TouchableOpacity>

          {!isLast ? (
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnPrimary, !canNext && { opacity: 0.4 }]}
              onPress={() => setStep((s) => s + 1)}
              disabled={!canNext}
            >
              <Text style={styles.navBtnPrimaryText}>Дальше</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnPrimary, (!readyToSubmit || loading) && { opacity: 0.4 }]}
              onPress={submit}
              disabled={!readyToSubmit || loading}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.navBtnPrimaryText}>Готово</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  progressBar: {
    height: 3,
    backgroundColor: colors.border,
  },
  progressFill: { height: 3, backgroundColor: colors.primary },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 6, marginBottom: 20 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepInfo: { color: colors.textDim, fontSize: 12, marginBottom: 6 },
  qTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    marginTop: 8,
  },
  optionActive: { borderColor: colors.primary },
  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: colors.textDim,
    marginRight: 10, alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  optionText: { color: colors.textMuted, fontSize: 14, flex: 1 },
  optionTextActive: { color: colors.text, fontWeight: '500' },
  nav: { flexDirection: 'row', marginTop: 20, gap: 12 },
  navBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  navBtnText: { color: colors.textMuted, fontSize: 15 },
  navBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  navBtnPrimaryText: { color: '#000', fontSize: 15, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginTop: 12 },
});
