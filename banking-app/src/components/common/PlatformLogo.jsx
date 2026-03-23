import { useAppSettings } from '../../context/AppContext';

export default function PlatformLogo({
  size = 'md',         // 'sm' | 'md' | 'lg'
  showName = true,
  nameStyle = {},
  iconStyle = {},
  className = '',
}) {
  const { settings } = useAppSettings();

  const sizes = {
    sm: { icon: 28, font: 10, text: 16, radius: 8  },
    md: { icon: 36, font: 12, text: 18, radius: 10 },
    lg: { icon: 44, font: 14, text: 22, radius: 12 },
  };

  const s = sizes[size] || sizes.md;

  const iconContent = settings.logoUrl ? (
    <img
      src={settings.logoUrl}
      alt={settings.platformName}
      style={{ width: s.icon, height: s.icon, borderRadius: s.radius, objectFit: 'cover', ...iconStyle }}
    />
  ) : (
    <div style={{
      width:           s.icon,
      height:          s.icon,
      borderRadius:    s.radius,
      backgroundColor: '#38bdf8',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      flexShrink:      0,
      fontWeight:      700,
      fontSize:        s.font,
      color:           '#0f172a',
      fontFamily:      "'DM Sans', sans-serif",
      ...iconStyle,
    }}>
      {settings.logoText ||
        (settings.platformName
          ? settings.platformName.slice(0, 2).toUpperCase()
          : 'NP')}
    </div>
  );

  if (!showName) return iconContent;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className={className}>
      {iconContent}
      <span style={{
        color:      '#ffffff',
        fontSize:   s.text,
        fontWeight: 700,
        letterSpacing: '-0.3px',
        fontFamily: "'Playfair Display', serif",
        ...nameStyle,
      }}>
        {settings.platformName || 'NovaPay'}
      </span>
    </div>
  );
}