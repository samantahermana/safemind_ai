import {StyleSheet} from 'react-native';
import {colors, fontSize, layout, radius, spacing} from '../tokens';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
    paddingHorizontal: spacing.huge,
  },
  icon: {
    fontSize: layout.errorIconSize,
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: fontSize.xl,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: fontSize.title,
  },
  button: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.huge,
    paddingVertical: layout.buttonPaddingVertical,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: '600',
  },
  hint: {
    fontSize: fontSize.base,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.xxl,
    fontStyle: 'italic',
  },
});
