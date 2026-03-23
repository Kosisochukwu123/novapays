import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Minus, Loader } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SENDER_CFG = {
  user:  { align: 'flex-end',   bg: '#38bdf8',              color: '#0f172a', label: 'You'     },
  bot:   { align: 'flex-start', bg: 'rgba(255,255,255,0.08)', color: '#f1f5f9', label: 'NovaPay' },
  admin: { align: 'flex-start', bg: 'rgba(245,158,11,0.15)', color: '#f1f5f9', label: 'Support' },
};

const timeStr = (date) =>
  new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

export default function ChatWidget() {
  const { user } = useAuth();
  const [open,        setOpen]        = useState(false);
  const [minimised,   setMinimised]   = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [chatId,      setChatId]      = useState(null);
  const [input,       setInput]       = useState('');
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [unread,      setUnread]      = useState(0);
  const bottomRef     = useRef(null);
  const inputRef      = useRef(null);
  const pollingRef    = useRef(null);

  // ── Load chat ────────────────────────────────────────────────────────
  const loadChat = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/user/chat');
      const chat = res.data.chat;
      setChatId(chat._id);
      setMessages(chat.messages || []);
      const unreadCount = chat.messages.filter(
        m => m.sender !== 'user' && !m.readByUser
      ).length;
      setUnread(unreadCount);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadChat();
  }, [user, loadChat]);

  // Poll every 8 seconds for new admin messages
  useEffect(() => {
    if (!user) return;
    pollingRef.current = setInterval(() => loadChat(true), 8000);
    return () => clearInterval(pollingRef.current);
  }, [user, loadChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open && !minimised) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimised]);

  // Mark as read when opened
  useEffect(() => {
    if (open && !minimised && chatId) {
      setUnread(0);
      api.put('/user/chat/read').catch(() => {});
    }
  }, [open, minimised, chatId]);

  // Focus input when opened
  useEffect(() => {
    if (open && !minimised) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimised]);

  // ── Send message ─────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    // Optimistic update
    const tempMsg = {
      _id:        'temp_' + Date.now(),
      sender:     'user',
      text,
      createdAt:  new Date(),
      readByUser: true,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await api.post('/user/chat/message', { text });
      setMessages(res.data.chat.messages);
    } catch {
      // Remove temp message on failure
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) return null;

  return (
    <>
      {/* ── Floating button ── */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimised(false); }}
          style={{
            position:        'fixed',
            bottom:          28,
            right:           28,
            width:           54,
            height:          54,
            borderRadius:    '50%',
            backgroundColor: '#38bdf8',
            border:          'none',
            cursor:          'pointer',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            boxShadow:       '0 4px 24px rgba(56,189,248,0.4)',
            zIndex:          1000,
            transition:      'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageCircle size={24} color="#0f172a" />
          {unread > 0 && (
            <span style={{
              position:        'absolute',
              top:             -2,
              right:           -2,
              minWidth:        18,
              height:          18,
              borderRadius:    99,
              backgroundColor: '#ef4444',
              border:          '2px solid #0f172a',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        10,
              fontWeight:      700,
              color:           '#fff',
              fontFamily:      "'DM Sans', sans-serif",
              padding:         '0 3px',
            }}>
              {unread}
            </span>
          )}
        </button>
      )}

      {/* ── Chat panel ── */}
      {open && (
        <div style={{
          position:        'fixed',
          bottom:          28,
          right:           28,
          width:           340,
          height:          minimised ? 'auto' : 500,
          backgroundColor: '#1e293b',
          border:          '1px solid rgba(255,255,255,0.1)',
          borderRadius:    20,
          boxShadow:       '0 20px 60px rgba(0,0,0,0.5)',
          zIndex:          1000,
          display:         'flex',
          flexDirection:   'column',
          overflow:        'hidden',
          fontFamily:      "'DM Sans', sans-serif",
          transition:      'height 0.3s ease',
        }}>

          {/* Header */}
          <div style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'space-between',
            padding:         '14px 18px',
            backgroundColor: '#0f172a',
            borderBottom:    minimised ? 'none' : '1px solid rgba(255,255,255,0.08)',
            flexShrink:      0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Online indicator */}
              <div style={{ position: 'relative' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={18} color="#38bdf8" />
                </div>
                <span style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid #0f172a' }} />
              </div>
              <div>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0 }}>NovaPay Support</p>
                <p style={{ color: '#22c55e', fontSize: 11, margin: 0 }}>● Online</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setMinimised(m => !m)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Minus size={15} />
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Body — hidden when minimised */}
          {!minimised && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Welcome message */}
                {messages.length === 0 && !loading && (
                  <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <MessageCircle size={24} color="#38bdf8" />
                    </div>
                    <p style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600, margin: '0 0 6px' }}>
                      Welcome to NovaPay Support
                    </p>
                    <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                      Send us a message and we'll get back to you right away.
                    </p>
                  </div>
                )}

                {loading && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <Loader size={20} color="#38bdf8" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                )}

                {!loading && messages.map((msg, i) => {
                  const cfg     = SENDER_CFG[msg.sender] || SENDER_CFG.bot;
                  const isUser  = msg.sender === 'user';
                  const showLabel = i === 0 || messages[i-1]?.sender !== msg.sender;

                  return (
                    <div
                      key={msg._id || i}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: cfg.align }}
                    >
                      {showLabel && (
                        <p style={{ color: '#475569', fontSize: 10, margin: '0 0 4px', padding: '0 4px', fontWeight: 600 }}>
                          {cfg.label}
                        </p>
                      )}
                      <div style={{
                        maxWidth:     '80%',
                        padding:      '10px 14px',
                        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        backgroundColor: cfg.bg,
                        color:        cfg.color,
                        fontSize:     13,
                        lineHeight:   1.55,
                        wordBreak:    'break-word',
                      }}>
                        {msg.text}
                      </div>
                      <p style={{ color: '#334155', fontSize: 10, margin: '3px 0 0', padding: '0 4px' }}>
                        {timeStr(msg.createdAt)}
                        {isUser && (
                          <span style={{ marginLeft: 4, color: msg.readByAdmin ? '#38bdf8' : '#475569' }}>
                            {msg.readByAdmin ? '✓✓' : '✓'}
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{
                padding:      '12px 14px',
                borderTop:    '1px solid rgba(255,255,255,0.06)',
                display:      'flex',
                gap:          8,
                alignItems:   'flex-end',
                flexShrink:   0,
                backgroundColor: '#0f172a',
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  style={{
                    flex:            1,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border:          '1px solid rgba(255,255,255,0.1)',
                    borderRadius:    12,
                    padding:         '10px 14px',
                    color:           '#f1f5f9',
                    fontSize:        13,
                    outline:         'none',
                    fontFamily:      "'DM Sans', sans-serif",
                    resize:          'none',
                    maxHeight:       100,
                    lineHeight:      1.5,
                  }}
                  onFocus={e => e.target.style.borderColor = '#38bdf8'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  style={{
                    width:           38,
                    height:          38,
                    borderRadius:    12,
                    border:          'none',
                    cursor:          (!input.trim() || sending) ? 'not-allowed' : 'pointer',
                    backgroundColor: (!input.trim() || sending) ? '#334155' : '#38bdf8',
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    flexShrink:      0,
                    transition:      'all 0.15s',
                    opacity:         (!input.trim() || sending) ? 0.5 : 1,
                  }}
                >
                  {sending
                    ? <Loader size={15} color="#0f172a" style={{ animation: 'spin 1s linear infinite' }} />
                    : <Send size={15} color="#0f172a" />
                  }
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}