import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp, TrendingDown, RefreshCw, BarChart2,
  ArrowUpRight, ArrowDownLeft, Search, Star,
  Trophy, XCircle, Clock, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Asset catalogue ───────────────────────────────────────────────────────
const ASSETS = {
  crypto: [
    { symbol: 'BTC',  name: 'Bitcoin',   id: 'bitcoin'       },
    { symbol: 'ETH',  name: 'Ethereum',  id: 'ethereum'      },
    { symbol: 'BNB',  name: 'BNB',       id: 'binancecoin'   },
    { symbol: 'SOL',  name: 'Solana',    id: 'solana'        },
    { symbol: 'XRP',  name: 'XRP',       id: 'ripple'        },
    { symbol: 'ADA',  name: 'Cardano',   id: 'cardano'       },
    { symbol: 'DOGE', name: 'Dogecoin',  id: 'dogecoin'      },
    { symbol: 'AVAX', name: 'Avalanche', id: 'avalanche-2'   },
  ],
  forex: [
    { symbol: 'EUR/USD', name: 'Euro / US Dollar',        id: 'forex_eurusd' },
    { symbol: 'GBP/USD', name: 'Pound / US Dollar',       id: 'forex_gbpusd' },
    { symbol: 'USD/JPY', name: 'US Dollar / Yen',         id: 'forex_usdjpy' },
    { symbol: 'USD/NGN', name: 'US Dollar / Naira',       id: 'forex_usdngn' },
    { symbol: 'AUD/USD', name: 'Australian / US Dollar',  id: 'forex_audusd' },
    { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', id: 'forex_usdchf' },
  ],
  stock: [
    { symbol: 'AAPL',  name: 'Apple Inc.',     id: 'stock_aapl'  },
    { symbol: 'TSLA',  name: 'Tesla Inc.',     id: 'stock_tsla'  },
    { symbol: 'GOOGL', name: 'Alphabet Inc.',  id: 'stock_googl' },
    { symbol: 'MSFT',  name: 'Microsoft Corp.',id: 'stock_msft'  },
    { symbol: 'AMZN',  name: 'Amazon.com Inc.',id: 'stock_amzn'  },
    { symbol: 'NVDA',  name: 'Nvidia Corp.',   id: 'stock_nvda'  },
  ],
  commodity: [
    { symbol: 'XAU', name: 'Gold',        id: 'commodity_gold'   },
    { symbol: 'XAG', name: 'Silver',      id: 'commodity_silver' },
    { symbol: 'OIL', name: 'Crude Oil',   id: 'commodity_oil'    },
    { symbol: 'GAS', name: 'Natural Gas', id: 'commodity_gas'    },
  ],
};

const BASE_PRICES = {
  forex_eurusd: 1.0856, forex_gbpusd: 1.2734, forex_usdjpy: 149.82,
  forex_usdngn: 1580.0, forex_audusd: 0.6521, forex_usdchf: 0.9012,
  stock_aapl:  224.72,  stock_tsla:  172.48,  stock_googl: 175.93,
  stock_msft:  415.50,  stock_amzn:  202.88,  stock_nvda:  875.35,
  commodity_gold: 2332.40, commodity_silver: 27.84,
  commodity_oil:  78.45,   commodity_gas:    2.18,
};

// const isMobile = window.innerWidth < 640;

const CATEGORY_TABS = [
  { key: 'crypto',    label: 'Crypto',      color: '#f59e0b' },
  { key: 'forex',     label: 'Forex',       color: '#38bdf8' },
  { key: 'stock',     label: 'Stocks',      color: '#22c55e' },
  { key: 'commodity', label: 'Commodities', color: '#c084fc' },
];

const CAT_COLOR = {
  crypto: '#f59e0b', forex: '#38bdf8', stock: '#22c55e', commodity: '#c084fc',
};

const OUTCOME_CFG = {
  pending:  { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  Icon: Clock,    label: 'Pending'  },
  win:      { color: '#4ade80', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)',   Icon: Trophy,   label: 'Won'      },
  loss:     { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   Icon: XCircle,  label: 'Lost'     },
};

const fluctuate = (base, pct = 0.03) => {
  const change = base * pct * (Math.random() - 0.5);
  return parseFloat((base + change).toFixed(base > 100 ? 2 : 4));
};

const genHistory = (base, points = 24) => {
  const data = [];
  let p = base * (0.92 + Math.random() * 0.08);
  for (let i = 0; i < points; i++) {
    p = fluctuate(p, 0.02);
    data.push({ t: i, price: parseFloat(p.toFixed(base > 100 ? 2 : 4)) });
  }
  data.push({ t: points, price: base });
  return data;
};

const card = {
  backgroundColor: '#1e293b',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
};

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', fontSize: 12 }}>
      <p style={{ color: '#f1f5f9' }}>${payload[0].value.toLocaleString()}</p>
    </div>
  );
};

export default function TradingPage() {
  const { user }  = useAuth();
  const { t }     = useTranslation();
  const prevPrices = useRef({});

  const [category,     setCategory]     = useState('crypto');
  const [prices,       setPrices]       = useState({});
  const [changes,      setChanges]      = useState({});
  const [histories,    setHistories]    = useState({});
  const [selected,     setSelected]     = useState(null);
  const [action,       setAction]       = useState('buy');
  const [quantity,     setQuantity]     = useState('');
  const [balance,      setBalance]      = useState(0);
  const [trades,       setTrades]       = useState([]);
  const [search,       setSearch]       = useState('');
  const [loading,      setLoading]      = useState(false);
  const [tradesLoading,setTradesLoading]= useState(true);
  const [priceLoading, setPriceLoading] = useState(true);
  const [tradeMsg,     setTradeMsg]     = useState(null);
  const [tab,          setTab]          = useState('market');
  const [lastTradeRefresh, setLastTradeRefresh] = useState(null);

  // ── Live prices ──────────────────────────────────────────────────────
  const fetchPrices = useCallback(async () => {
    try {
      const ids = ASSETS.crypto.map(a => a.id).join(',');
      const res  = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await res.json();

      const newPrices  = { ...prevPrices.current };
      const newChanges = {};

      ASSETS.crypto.forEach(asset => {
        const d = data[asset.id];
        if (d) {
          newPrices[asset.id]  = d.usd;
          newChanges[asset.id] = parseFloat((d.usd_24h_change || 0).toFixed(2));
        }
      });

      Object.keys(BASE_PRICES).forEach(id => {
        const prev = newPrices[id] || BASE_PRICES[id];
        newPrices[id]  = fluctuate(prev, 0.001);
        newChanges[id] = parseFloat(
          ((newPrices[id] - BASE_PRICES[id]) / BASE_PRICES[id] * 100).toFixed(2)
        );
      });

      prevPrices.current = { ...newPrices };
      setPrices(newPrices);
      setChanges(newChanges);
      setPriceLoading(false);
    } catch {
      // Fallback simulation
      const fallback = {
        bitcoin: 67420, ethereum: 3521, binancecoin: 412,
        solana: 178, ripple: 0.62, cardano: 0.48,
        dogecoin: 0.165, 'avalanche-2': 38.5,
      };
      const newPrices  = {};
      const newChanges = {};

      ASSETS.crypto.forEach(a => {
        const base = prevPrices.current[a.id] || fallback[a.id] || 100;
        newPrices[a.id]  = fluctuate(base, 0.005);
        newChanges[a.id] = parseFloat(((Math.random() - 0.48) * 10).toFixed(2));
      });
      Object.keys(BASE_PRICES).forEach(id => {
        const prev = prevPrices.current[id] || BASE_PRICES[id];
        newPrices[id]  = fluctuate(prev, 0.001);
        newChanges[id] = parseFloat(((Math.random() - 0.48) * 2).toFixed(2));
      });

      prevPrices.current = { ...newPrices };
      setPrices(newPrices);
      setChanges(newChanges);
      setPriceLoading(false);
    }
  }, []);

  // Generate chart histories
  useEffect(() => {
    if (Object.keys(prices).length === 0) return;
    const h = {};
    [...ASSETS.crypto, ...ASSETS.forex, ...ASSETS.stock, ...ASSETS.commodity].forEach(a => {
      if (!histories[a.id]) {
        h[a.id] = genHistory(prices[a.id] || BASE_PRICES[a.id] || 100);
      }
    });
    if (Object.keys(h).length > 0) setHistories(prev => ({ ...prev, ...h }));
  }, [prices]);

  // ── Fetch user balance + trades from backend ─────────────────────────
  const fetchUserData = useCallback(async (showLoader = false) => {
    if (showLoader) setTradesLoading(true);
    try {
      const [dashRes, tradesRes] = await Promise.all([
        api.get('/user/dashboard'),
        api.get('/user/trades'),
      ]);
      setBalance(dashRes.data.balance ?? 0);
      setTrades(tradesRes.data.trades || []);
      setLastTradeRefresh(new Date());
    } catch (err) {
      console.error('fetchUserData error:', err);
    } finally {
      setTradesLoading(false);
    }
  }, []);

  // ── Init + polling ───────────────────────────────────────────────────
  useEffect(() => {
    fetchPrices();
    fetchUserData(true);

    const priceInterval = setInterval(fetchPrices, 15000);       // prices every 15s
    const tradeInterval = setInterval(() => fetchUserData(false), 20000); // trades every 20s

    return () => {
      clearInterval(priceInterval);
      clearInterval(tradeInterval);
    };
  }, []);

  // ── Execute trade ────────────────────────────────────────────────────
  const handleTrade = async () => {
    if (!selected || !quantity || parseFloat(quantity) <= 0) return;
    const price = prices[selected.id];
    if (!price) return;

    setLoading(true);
    setTradeMsg(null);
    try {
      const res = await api.post('/user/trade', {
        symbol:       selected.symbol,
        name:         selected.name,
        assetType:    category === 'forex' ? 'forex'
                    : category === 'stock' ? 'stock'
                    : category === 'commodity' ? 'commodity'
                    : 'crypto',
        action,
        quantity:     parseFloat(quantity),
        priceAtTrade: price,
      });

      setBalance(res.data.balance);
      setTrades(prev => [res.data.trade, ...prev]);
      setTradeMsg({
        ok:  true,
        msg: `${action === 'buy' ? t('trading.buy') : t('trading.sell')} ${quantity} ${selected.symbol} @ $${price.toLocaleString()}`,
      });
      setQuantity('');
    } catch (err) {
      setTradeMsg({ ok: false, msg: err.response?.data?.message || 'Trade failed' });
    } finally {
      setLoading(false);
      setTimeout(() => setTradeMsg(null), 5000);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────
  const getPrice  = (id) => prices[id]  ?? BASE_PRICES[id] ?? 0;
  const getChange = (id) => changes[id] ?? 0;

  const total = selected && quantity
    ? (parseFloat(quantity) * getPrice(selected.id)).toFixed(2)
    : '0.00';

  const allAssets     = ASSETS[category] || [];
  const filteredAssets = allAssets.filter(a =>
    a.symbol.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  // Trade stats
  const openTrades   = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status === 'closed');
  const wonTrades    = trades.filter(t => t.outcome === 'win');
  const lostTrades   = trades.filter(t => t.outcome === 'loss');

  const totalProfit = wonTrades.reduce((s, t) => s + (t.returnAmount - t.total), 0);
  const totalLoss   = lostTrades.reduce((s, t) => s + t.total, 0);
  const netPnL      = totalProfit - totalLoss;

  const portfolioValue = openTrades.reduce((s, t) => {
    const findAsset = (cat) => ASSETS[cat]?.find(a => a.symbol === t.symbol)?.id;
    const id = findAsset('crypto') || findAsset('forex') || findAsset('stock') || findAsset('commodity');
    return s + ((id ? getPrice(id) : t.priceAtTrade) * t.quantity);
  }, 0);

  // ── Skeleton for trades ───────────────────────────────────────────────
  const TradesSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr 1fr', gap: 10, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#0f172a', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ width: 60, height: 12, borderRadius: 4, backgroundColor: '#0f172a' }} />
              <div style={{ width: 80, height: 10, borderRadius: 4, backgroundColor: '#0f172a' }} />
            </div>
          </div>
          {[60, 50, 70, 60, 80].map((w, j) => (
            <div key={j} style={{ width: w, height: 12, borderRadius: 4, backgroundColor: '#0f172a' }} />
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <UserLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#f1f5f9', overflow:"scroll" }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
              {t('trading.title')}
            </h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              {t('trading.subtitle')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#64748b', fontSize: 11 }}>{t('trading.availableBalance')}</p>
              <p style={{ color: '#38bdf8', fontSize: 20, fontWeight: 700 }}>
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <button
              onClick={() => { fetchPrices(); fetchUserData(false); }}
              style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Page tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 22, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {[
            { key: 'market',    label: t('trading.market')   },
            { key: 'portfolio', label: t('trading.myTrades') },
          ].map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              style={{
                padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
                backgroundColor: tab === tb.key ? '#1e293b' : 'transparent',
                color: tab === tb.key ? '#fff' : '#64748b',
              }}>
              {tb.label}
              {tb.key === 'portfolio' && trades.length > 0 && (
                <span style={{ marginLeft: 6, fontSize: 11, backgroundColor: '#38bdf8', color: '#0f172a', borderRadius: 20, padding: '1px 6px', fontWeight: 700 }}>
                  {trades.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══ MARKET TAB ══════════════════════════════════════════════════ */}
        {tab === 'market' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>

            {/* Asset list */}
            <div>
              {/* Category tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {CATEGORY_TABS.map(ct => (
                  <button key={ct.key}
                    onClick={() => { setCategory(ct.key); setSelected(null); setSearch(''); }}
                    style={{
                      padding: '8px 18px', borderRadius: 10, border: '1px solid', cursor: 'pointer',
                      fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                      backgroundColor: category === ct.key ? `${ct.color}20` : 'rgba(255,255,255,0.04)',
                      borderColor:     category === ct.key ? ct.color        : 'rgba(255,255,255,0.08)',
                      color:           category === ct.key ? ct.color        : '#94a3b8',
                    }}>
                    {ct.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${category}...`}
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px 10px 34px', color: '#f1f5f9', fontSize: 13, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = CAT_COLOR[category]}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>

              {/* Asset rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredAssets.map(asset => {
                  const price      = getPrice(asset.id);
                  const change     = getChange(asset.id);
                  const isUp       = change >= 0;
                  const isSelected = selected?.id === asset.id;
                  const hist       = histories[asset.id] || [];

                  return (
                    <div
                      key={asset.id}
                      onClick={() => { setSelected(asset); setQuantity(''); setTradeMsg(null); }}
                      style={{
                        ...card, padding: '14px 18px', cursor: 'pointer',
                        display: 'grid', gridTemplateColumns: '1fr 120px 100px',
                        alignItems: 'center', gap: 12,
                        border: `1px solid ${isSelected ? CAT_COLOR[category] : 'rgba(255,255,255,0.06)'}`,
                        backgroundColor: isSelected ? `${CAT_COLOR[category]}08` : '#1e293b',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#1e293b'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${CAT_COLOR[category]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: CAT_COLOR[category], fontSize: 11, fontWeight: 700 }}>{asset.symbol.slice(0,3)}</span>
                        </div>
                        <div>
                          <p style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600 }}>{asset.symbol}</p>
                          <p style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>{asset.name}</p>
                        </div>
                      </div>

                      <div style={{ height: 36 }}>
                        {hist.length > 0 && (
                          <ResponsiveContainer width="100%" height={36}>
                            <AreaChart data={hist} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                              <defs>
                                <linearGradient id={`sg_${asset.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%"  stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                                  <stop offset="95%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="price" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth={1.5} fill={`url(#sg_${asset.id})`} dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                          {priceLoading ? '...' : `$${price >= 1 ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : price.toFixed(4)}`}
                        </p>
                        <p style={{ fontSize: 11, marginTop: 2, color: isUp ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {isUp ? '+' : ''}{change}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trade panel */}
            <div style={{ position: 'sticky', top: 20}}>
              {selected ? (
                <div style={{ ...card, padding: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <p style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{selected.symbol}</p>
                      <p style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{selected.name}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>
                        ${getPrice(selected.id) >= 1 ? getPrice(selected.id).toLocaleString('en-US', { minimumFractionDigits: 2 }) : getPrice(selected.id).toFixed(4)}
                      </p>
                      <p style={{ fontSize: 11, color: getChange(selected.id) >= 0 ? '#22c55e' : '#ef4444', marginTop: 2 }}>
                        {getChange(selected.id) >= 0 ? '+' : ''}{getChange(selected.id)}% (24h)
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={histories[selected.id] || []}>
                        <defs>
                          <linearGradient id="tradeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={CAT_COLOR[category]} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={CAT_COLOR[category]} stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis hide /><YAxis hide domain={['auto', 'auto']} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="price" stroke={CAT_COLOR[category]} strokeWidth={2} fill="url(#tradeGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Buy/Sell */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {['buy', 'sell'].map(a => (
                      <button key={a} onClick={() => setAction(a)}
                        style={{
                          flex: 1, padding: '10px', borderRadius: 10, border: '1px solid', cursor: 'pointer',
                          fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                          backgroundColor: action === a ? (a === 'buy' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : 'rgba(255,255,255,0.04)',
                          borderColor:     action === a ? (a === 'buy' ? 'rgba(34,197,94,0.4)'  : 'rgba(239,68,68,0.4)')  : 'rgba(255,255,255,0.08)',
                          color:           action === a ? (a === 'buy' ? '#4ade80'               : '#f87171')               : '#64748b',
                        }}>
                        {a === 'buy' ? `↑ ${t('trading.buy')}` : `↓ ${t('trading.sell')}`}
                      </button>
                    ))}
                  </div>

                  {/* Quantity */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>{t('trading.quantity')}</label>
                    <input
                      type="number" value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      placeholder="0.00"
                      style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = CAT_COLOR[category]}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>

                  {/* Quick qty */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                    {['0.01','0.1','0.5','1','10'].map(q => (
                      <button key={q} onClick={() => setQuantity(q)}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', border: '1px solid', fontFamily: "'DM Sans', sans-serif",
                          backgroundColor: quantity === q ? `${CAT_COLOR[category]}20` : 'rgba(255,255,255,0.04)',
                          borderColor:     quantity === q ? CAT_COLOR[category]        : 'rgba(255,255,255,0.08)',
                          color:           quantity === q ? CAT_COLOR[category]        : '#94a3b8',
                        }}>
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
                    <span style={{ color: '#64748b', fontSize: 13 }}>{t('trading.total')}</span>
                    <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>${parseFloat(total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {/* Trade feedback */}
                  {tradeMsg && (
                    <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                      backgroundColor: tradeMsg.ok ? 'rgba(34,197,94,0.1)'  : 'rgba(239,68,68,0.1)',
                      border:          tradeMsg.ok ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)',
                      color:           tradeMsg.ok ? '#4ade80'               : '#f87171',
                    }}>
                      {tradeMsg.ok ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {tradeMsg.msg}
                    </div>
                  )}

                  {/* Execute */}
                  <button
                    onClick={handleTrade}
                    disabled={loading || !quantity || parseFloat(quantity) <= 0}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                      cursor: (loading || !quantity) ? 'not-allowed' : 'pointer',
                      backgroundColor: (loading || !quantity) ? '#334155' : action === 'buy' ? '#22c55e' : '#ef4444',
                      color: '#fff', fontWeight: 700, fontSize: 15,
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: (loading || !quantity) ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {loading ? t('trading.processing') : `${action === 'buy' ? t('trading.buy') : t('trading.sell')} ${selected.symbol}`}
                  </button>

                  {action === 'buy' && parseFloat(total) > balance && (
                    <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                      ⚠ {t('trading.insufficientBalance')}
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ ...card, padding: 32, textAlign: 'center' }}>
                  <BarChart2 size={36} color="#334155" style={{ marginBottom: 14 }} />
                  <p style={{ color: '#64748b', fontSize: 14 }}>{t('trading.selectAsset')}</p>
                  <p style={{ color: '#334155', fontSize: 12, marginTop: 6 }}>{t('trading.selectAssetSub')}</p>
                </div>
              )}

              {portfolioValue > 0 && (
                <div style={{ ...card, padding: '14px 18px', marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#64748b', fontSize: 11 }}>{t('trading.portfolioValue')}</p>
                    <p style={{ color: '#22c55e', fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                      ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Star size={16} color="#fbbf24" />
                </div>
              )}
            </div>

          </div>
        )}

        {/* ══ MY TRADES TAB ═══════════════════════════════════════════════ */}
        {tab === 'portfolio' && (
          <div>

            {/* Stats */}
            {!tradesLoading && trades.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 22 }}>
                {[
                  { label: t('trading.totalTrades'), value: trades.length,         color: '#f1f5f9' },
                  { label: 'Open',                   value: openTrades.length,      color: '#fbbf24' },
                  { label: 'Closed',                  value: closedTrades.length,   color: '#94a3b8' },
                  { label: 'Won',                     value: wonTrades.length,      color: '#4ade80' },
                  { label: 'Lost',                    value: lostTrades.length,     color: '#f87171' },
                ].map(s => (
                  <div key={s.label} style={{ ...card, padding: '14px 16px', textAlign: 'center' }}>
                    <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{s.label}</p>
                    <p style={{ color: s.color, fontSize: 20, fontWeight: 700 }}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Net P&L banner */}
            {closedTrades.length > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', borderRadius: 14, marginBottom: 20,
                backgroundColor: netPnL >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${netPnL >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
              }}>
                <div>
                  <p style={{ color: '#64748b', fontSize: 12 }}>Net Profit / Loss (closed trades)</p>
                  <p style={{ color: netPnL >= 0 ? '#4ade80' : '#f87171', fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                    {netPnL >= 0 ? '+' : ''}${netPnL.toFixed(2)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Win rate</p>
                  <p style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700 }}>
                    {closedTrades.length > 0 ? Math.round((wonTrades.length / closedTrades.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            )}

            {/* Last refreshed */}
            {lastTradeRefresh && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ color: '#334155', fontSize: 12 }}>
                  Auto-refreshes every 20s · Last updated {lastTradeRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
                <button
                  onClick={() => fetchUserData(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >
                  <RefreshCw size={11} /> Refresh now
                </button>
              </div>
            )}

            {/* Trades table */}
            {tradesLoading ? (
              <div style={{ ...card, overflow: 'hidden' }}><TradesSkeleton /></div>
            ) : trades.length === 0 ? (
              <div style={{ ...card, padding: '56px 24px', textAlign: 'center' }}>
                <BarChart2 size={40} color="#334155" style={{ marginBottom: 16 }} />
                <p style={{ color: '#64748b', fontSize: 14 }}>{t('trading.noTrades')}</p>
                <button onClick={() => setTab('market')}
                  style={{ marginTop: 20, padding: '10px 24px', borderRadius: 12, border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {t('trading.openMarket')}
                </button>
              </div>
            ) : (
              <div style={{ ...card, overflow: 'hidden' }}>

                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr 1fr', gap: 10, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <span>Asset</span>
                  <span>Action</span>
                  <span>{t('trading.quantity')}</span>
                  <span>Price</span>
                  <span>{t('trading.total')}</span>
                  <span style={{ textAlign: 'center' }}>Outcome</span>
                </div>

                {trades.map((trade, i) => {
                  const isBuy    = trade.action === 'buy';
                  const outCfg   = OUTCOME_CFG[trade.outcome] || OUTCOME_CFG.pending;
                  const OutIcon  = outCfg.Icon;
                  const isClosed = trade.status === 'closed';

                  return (
                    <div
                      key={trade._id}
                      style={{
                        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr 1fr',
                        gap: 10, padding: '14px 20px', alignItems: 'center',
                        borderBottom: i < trades.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        transition: 'background 0.15s',
                        // Highlight newly resolved trades
                        backgroundColor: trade.outcome === 'win'  ? 'rgba(34,197,94,0.03)'
                                        : trade.outcome === 'loss' ? 'rgba(239,68,68,0.03)'
                                        : 'transparent',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor =
                        trade.outcome === 'win'  ? 'rgba(34,197,94,0.03)'
                      : trade.outcome === 'loss' ? 'rgba(239,68,68,0.03)'
                      : 'transparent'
                      }
                    >
                      {/* Asset */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#38bdf8', fontSize: 10, fontWeight: 700 }}>{trade.symbol?.slice(0,3)}</span>
                        </div>
                        <div>
                          <p style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 500 }}>{trade.symbol}</p>
                          <p style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>
                            {new Date(trade.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' · '}
                            <span style={{ textTransform: 'capitalize', color: '#475569' }}>{trade.assetType}</span>
                          </p>
                        </div>
                      </div>

                      {/* Action */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: isBuy ? '#4ade80' : '#f87171' }}>
                        {isBuy ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                        {trade.action}
                      </span>

                      {/* Qty */}
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>{trade.quantity}</span>

                      {/* Price */}
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>
                        ${trade.priceAtTrade?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>

                      {/* Total invested */}
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                        ${trade.total?.toFixed(2)}
                      </span>

                      {/* Outcome */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 10px', borderRadius: 20, backgroundColor: outCfg.bg, color: outCfg.color, border: `1px solid ${outCfg.border}` }}>
                          <OutIcon size={11} /> {outCfg.label}
                        </span>

                        {/* Show return/loss amount for closed trades */}
                        {isClosed && trade.outcome === 'win' && (
                          <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>
                            +${(trade.returnAmount - trade.total)?.toFixed(2)} profit
                          </span>
                        )}
                        {isClosed && trade.outcome === 'loss' && (
                          <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>
                            -${trade.total?.toFixed(2)} lost
                          </span>
                        )}

                        {/* Admin note if present */}
                        {isClosed && trade.adminNote && (
                          <span style={{ fontSize: 10, color: '#475569', maxWidth: 100, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            "{trade.adminNote}"
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
}