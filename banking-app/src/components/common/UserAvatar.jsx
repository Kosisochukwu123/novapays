import { useAuth } from '../../context/AuthContext';

export default function UserAvatar({
  size       = 38,
  radius     = '50%',
  fontSize   = 13,
  onClick    = null,
  style      = {},
  showBorder = false,
}) {
  const { user } = useAuth();

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const base = {
    width:           size,
    height:          size,
    borderRadius:    radius,
    flexShrink:      0,
    cursor:          onClick ? 'pointer' : 'default',
    overflow:        'hidden',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    border:          showBorder ? '2px solid rgba(56,189,248,0.4)' : 'none',
    transition:      'opacity 0.2s',
    ...style,
  };

  if (user?.profileImage) {
    return (
      <div style={base} onClick={onClick}>
        <img
          src={user.profileImage}
          alt={user.fullName}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{ ...base, backgroundColor: '#38bdf8' }}
      onClick={onClick}
    >
      <span style={{ color: '#0f172a', fontSize, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
        {initials}
      </span>
    </div>
  );
}