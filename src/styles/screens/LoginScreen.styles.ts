import {StyleSheet} from 'react-native';
import {colors, effects, fontSize, radius, spacing, stroke} from '../tokens';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.huge,
    backgroundColor: colors.backgroundSoft,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.textPrimary,
    marginBottom: radius.xs,
  },
  subtitle: {
    fontSize: fontSize.xl,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    color: colors.textSecondary,
  },
  roleSelector: {
    marginBottom: spacing.xxl,
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    elevation: effects.elevationXs,
  },
  roleLabel: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  roleButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: stroke.regular,
    borderColor: colors.roleBorder,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: colors.success,
    backgroundColor: colors.roleActiveBg,
  },
  roleButtonText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: colors.successDark,
    fontWeight: 'bold',
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: radius.xs,
    marginLeft: radius.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: stroke.thin,
    borderColor: colors.roleBorder,
    padding: spacing.xl,
    borderRadius: radius.md,
    marginBottom: spacing.xxl,
    color: colors.black,
    fontSize: fontSize.xl,
    elevation: effects.elevationXs,
  },
  button: {
    backgroundColor: colors.success,
    padding: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    elevation: effects.elevationSm,
  },
  buttonText: {color: colors.white, fontWeight: 'bold', fontSize: fontSize.xl},
  googleButton: {
    backgroundColor: colors.googleRed,
    marginTop: spacing.md,
  },
  switchText: {
    textAlign: 'center',
    marginTop: spacing.xxxl,
    color: colors.info,
    fontWeight: '500',
  },
});
