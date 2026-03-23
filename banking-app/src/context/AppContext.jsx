import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const AppContext = createContext(null);

const DEFAULT_SETTINGS = {
  platformName:       'NovaPay',
  logoUrl:            '',
  logoText:           'NP',
  defaultCurrency:    'USD',
  transferLimit:      '10000',
  minBalance:         '10',
  requireApproval:    true,
  twoFactorAdmin:     true,
  emailNotifications: true,
  smsNotifications:   false,
  maintenanceMode:    false,
  allowRegistration:  true,
  maxTransferPerDay:  '50000',
  supportEmail:       'support@novapay.com',
};

const STORAGE_KEY = 'platform_settings';

const loadCached = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export const AppProvider = ({ children }) => {
  const [settings,        setSettings]        = useState(loadCached);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const fetchedRef = useRef(false); // prevent duplicate fetches

  useEffect(() => {
    // Only fetch once per app session
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchSettings = async () => {
      try {
        // Use PUBLIC endpoint — no auth required
        const res = await api.get('/settings');
        const merged = { ...DEFAULT_SETTINGS, ...res.data };
        setSettings(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch (err) {
        // Silently fall back to cached/defaults — never throw or retry
        console.warn('Could not fetch platform settings, using defaults');
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchSettings();
  }, []); // empty deps — run once only

  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch { /* ignore storage errors */ }
  };

  return (
    <AppContext.Provider value={{ settings, updateSettings, settingsLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppSettings = () => useContext(AppContext);