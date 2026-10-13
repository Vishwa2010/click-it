import { forwardRef, useState } from 'react'
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native'
import { colors, fonts, radius, type, TOUCH } from '../../theme'

interface Props extends Omit<TextInputProps, 'style'> {
  label: string
  hint?: string
  invalid?: boolean
}

// Labelled input with a visible focus state (skill: focus-states, form-labels)
const TextField = forwardRef<TextInput, Props>(function TextField({ label, hint, invalid, onFocus, onBlur, ...rest }, ref) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={styles.wrap}>
      <Text style={type.eyebrow}>{label}</Text>
      <TextInput
        ref={ref}
        {...rest}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        style={[styles.input, focused && styles.focused, invalid && styles.invalid]}
      />
      {hint ? <Text style={type.caption}>{hint}</Text> : null}
    </View>
  )
})

export default TextField

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  input: {
    minHeight: TOUCH + 8,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 16,
    color: colors.ink,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  focused: { borderColor: colors.ink },
  invalid: { borderColor: colors.error },
})
