import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii } from '../../theme/colors';

type Props = React.ComponentProps<typeof TextInput> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, style, ...props }: Props) {
  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...props}
        placeholderTextColor={colors.textDim}
        style={[styles.input, error ? { borderColor: colors.danger } : null, style as any]}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(54,54,54,0.3)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  hint: { color: colors.textDim, fontSize: 12, marginTop: 4 },
});
