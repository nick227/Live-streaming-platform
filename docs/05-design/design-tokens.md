# Design Tokens Documentation

## Color tokens

```ts
export const colors = {
  bg: '#07070A',
  surface: '#101014',
  surfaceElevated: '#17171D',
  overlay: 'rgba(0, 0, 0, 0.62)',
  overlaySoft: 'rgba(0, 0, 0, 0.38)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  text: '#F7F7F8',
  textMuted: '#A1A1AA',
  textSubtle: '#71717A',
  primary: '#FFFFFF',
  primaryText: '#09090B',
  accent: '#8B5CF6',
  live: '#FF3B5C',
  token: '#D6A73A',
  success: '#22C55E',
  warning: '#F97316',
  danger: '#EF4444',
}
```

## Radius tokens

```ts
export const radius = {
  xs: '6px',
  sm: '10px',
  md: '14px',
  lg: '18px',
  xl: '24px',
  pill: '999px',
}
```

## Spacing tokens

```ts
export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
}
```

## Typography tokens

```ts
export const typography = {
  fontSans: 'Inter, Geist Sans, system-ui, sans-serif',
  fontMono: 'JetBrains Mono, ui-monospace, monospace',
  textXs: '12px',
  textSm: '14px',
  textMd: '16px',
  textLg: '18px',
  textXl: '24px',
}
```

## Overlay behavior tokens

```ts
export const overlays = {
  fadeDelayMs: 2500,
  fadeDurationMs: 180,
  backdropBlur: '12px',
}
```

## Z-index tokens

```ts
export const z = {
  roomSurface: 0,
  overlays: 10,
  chatDrawer: 20,
  modal: 50,
  toast: 60,
}
```
