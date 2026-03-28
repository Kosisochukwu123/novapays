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
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
};

const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
};

export const AppProvider = ({ children }) => {
  const [settings,        setSettings]        = useState(loadCached);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Only fetch once per session
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchSettings = async () => {
      setSettingsLoading(true);
      try {
        const res  = await api.get('/settings');
        const data = res.data;

        // Only update if backend has actual data
        // Don't let an empty/default backend response wipe saved settings
        const hasRealData = data && (
          data.platformName ||
          data.logoUrl      ||
          data.logoText
        );

        if (hasRealData) {
          const merged = { ...DEFAULT_SETTINGS, ...data };
          setSettings(merged);
          saveToStorage(merged);
        }
        // If backend returned empty/defaults, keep what's in localStorage
      } catch {
        // Network error — keep using cached settings, don't wipe them
        console.warn('Could not fetch platform settings, using cached');
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    saveToStorage(merged);
  };

  return (
    <AppContext.Provider value={{ settings, updateSettings, settingsLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppSettings = () => useContext(AppContext);