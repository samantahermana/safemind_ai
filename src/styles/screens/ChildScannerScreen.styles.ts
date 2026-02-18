import {StyleSheet} from 'react-native';
import {colors, fontSize, layout, radius, spacing} from '../tokens';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  icon: {
    fontSize: layout.errorIconSize,
    marginBottom: spacing.xxl,
  },
  text: {
    fontSize: fontSize.xxl,
    color: colors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
  },
  subtext: {
    fontSize: fontSize.base,
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  button: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: radius.sm,
    marginTop: spacing.md,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: layout.scannerOverlayTop,
    left: 0,
    right: 0,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: colors.scannerOverlayDark,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
  },
  overlaySuccess: {
    backgroundColor: colors.scannerOverlayPrimary,
  },
  overlayText: {
    color: colors.white,
    fontSize: fontSize.xl,
    textAlign: 'center',
    fontWeight: '500',
  },
  scanFrame: {
    position: 'absolute',
    width: layout.scannerFrameSize,
    height: layout.scannerFrameSize,
  },
  corner: {
    position: 'absolute',
    width: layout.scannerCornerSize,
    height: layout.scannerCornerSize,
    borderColor: colors.brandPrimary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: layout.scannerCornerBorderWidth,
    borderLeftWidth: layout.scannerCornerBorderWidth,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: layout.scannerCornerBorderWidth,
    borderRightWidth: layout.scannerCornerBorderWidth,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: layout.scannerCornerBorderWidth,
    borderLeftWidth: layout.scannerCornerBorderWidth,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: layout.scannerCornerBorderWidth,
    borderRightWidth: layout.scannerCornerBorderWidth,
  },
});
