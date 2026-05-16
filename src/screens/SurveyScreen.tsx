import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { SurveyDef } from '../api/types';
import { colors, radii } from '../theme/colors';
import { Button } from '../components/ui/Button';
import { PillBadge } from '../components/ui/PillBadge';

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

  const progress = totalSteps > 1 ? step / (totalSteps - 1) : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <PillBadge icon={<Sparkles size={12} color={colors.primary} />} tone="primary" filled>
            Калибровка
          </PillBadge>
        </View>

        <Text style={styles.title}>Предварительный рейтинг</Text>
        <Text style={styles.subtitle}>
          Ответьте на несколько вопросов — это нужно один раз, чтобы подобрать стартовый рейтинг.
        </Text>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.stepInfo}>Вопрос {step + 1} из {totalSteps}</Text>

        {currentQuestion && (
          <View style={styles.card}>
            <Text style={styles.qTitle}>{currentQuestion.title}</Text>
            <View style={{ marginTop: 12, gap: 8 }}>
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
          <Button
            variant="outline"
            onPress={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{ flex: 1 }}
          >
            Назад
          </Button>

          {!isLast ? (
            <Button
              onPress={() => setStep((s) => s + 1)}
              disabled={!canNext}
              style={{ flex: 1 }}
            >
              Дальше
            </Button>
          ) : (
            <Button
              onPress={submit}
              loading={loading}
              disabled={!readyToSubmit}
              style={{ flex: 1 }}
            >
              Готово
            </Button>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },

  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 18,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.secondary,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radii.full },
  stepInfo: { color: colors.textMuted, fontSize: 12, marginTop: 8, marginBottom: 16, textAlign: 'center' },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qTitle: { color: colors.text, fontSize: 17, fontWeight: '600', lineHeight: 24 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(54,54,54,0.30)',
  },
  optionActive: { borderColor: colors.primary, backgroundColor: 'rgba(34,197,94,0.10)' },
  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: colors.textMuted,
    marginRight: 10, alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  optionText: { color: colors.textMuted, fontSize: 14, flex: 1 },
  optionTextActive: { color: colors.text, fontWeight: '500' },

  nav: { flexDirection: 'row', marginTop: 20, gap: 12 },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginTop: 12 },
});
