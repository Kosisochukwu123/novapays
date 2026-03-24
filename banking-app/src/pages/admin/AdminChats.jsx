import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, X, CheckCheck, Loader, RefreshCw, Circle } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../services/api';

const timeStr = (date) =>
  new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const dateStr = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const STATUS_CFG = {
  open:   { color: '#fbbf24', label: 'Open'   },
  active: { color: '#4ade80', label: 'Active' },
  closed: { color: '#64748b', label: 'Closed' },
};

export default function AdminChats() {
  const [chats,       setChats]       = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [msgLoading,  setMsgLoading]  = useState(false);
  const [filter,      setFilter]      = useState('all');
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const pollingRef = useRef(null);
  const isMobile = innerWidth < 590

  // ── Fetch all chats ─────────────────────────────────────────────────
  const fetchChats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/admin/chats');
      setChats(res.data.chats || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  // ── Fetch selected chat messages ────────────────────────────────────
  const fetchChat = useCallback(async (id, silent = false) => {
    if (!silent) setMsgLoading(true);
    try {
      const res = await api.get(`/admin/chats/${id}`);
      const chat = res.data.chat;
      setMessages(chat.messages || []);
      setSelected(chat);
      // Mark as read
      await api.put(`/admin/chats/${id}/read`);
      setChats(prev => prev.map(c =>
        c._id === id ? { ...c, unreadByAdmin: 0 } : c
      ));
    } catch { /* ignore */ }
    finally { setMsgLoading(false); }
  }, []);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  // Poll every 6 seconds
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchChats(true);
      if (selected?._id) fetchChat(selected._id, true);
    }, 6000);
    return () => clearInterval(pollingRef.current);
  }, [selected, fetchChats, fetchChat]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !selected || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const res = await api.post(`/admin/chats/${selected._id}/message`, { text });
      setMessages(res.data.chat.messages);
      setChats(prev => prev.map(c =>
        c._id === selected._id
          ? { ...c, lastMessage: text, lastMessageAt: new Date(), status: 'active' }
          : c
      ));
    } catch {
      setInput(text);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const closeChat = async () => {
    if (!selected) return;
    try {
      const res = await api.put(`/admin/chats/${selected._id}/close`);
      setSelected(res.data.chat);
      setChats(prev => prev.map(c => c._id === selected._id ? { ...c, status: 'closed' } : c));
    } catch { /* ignore */ }
  };

  // Total unread
  const totalUnread = chats.reduce((s, c) => s + (c.unreadByAdmin || 0), 0);

  const filteredChats = chats.filter(c =>
    filter === 'all' ? true : c.status === filter
  );

  return (
    <AdminLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif", height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
              Support Chats
            </h1>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
              Respond to user messages in real time
              {totalUnread > 0 && (
                <span style={{ marginLeft: 8, fontSize: 12, backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
                  {totalUnread} unread
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => fetchChats()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Main layout */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? "1fr" : '300px 1fr', gap: 16, minHeight: 0 }}>

          {/* ── Left: chat list ── */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Filter tabs */}
            <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3 }}>
                {['all', 'open', 'active', 'closed'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{
                      flex: 1, padding: '5px 0', borderRadius: 8, border: 'none',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11, fontWeight: 500, textTransform: 'capitalize',
                      backgroundColor: filter === f ? '#0f172a' : 'transparent',
                      color:           filter === f ? '#f1f5f9' : '#64748b',
                    }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                  <Loader size={20} color="#38bdf8" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : filteredChats.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <MessageCircle size={32} color="#334155" style={{ marginBottom: 10 }} />
                  <p style={{ color: '#64748b', fontSize: 13 }}>No chats yet</p>
                </div>
              ) : (
                filteredChats.map(chat => {
                  const isSelected = selected?._id === chat._id;
                  const statusCfg  = STATUS_CFG[chat.status] || STATUS_CFG.open;
                  const initials   = chat.user?.fullName
                    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U';

                  return (
                    <div
                      key={chat._id}
                      onClick={() => fetchChat(chat._id)}
                      style={{
                        display:         'flex',
                        gap:             10,
                        padding:         '12px 14px',
                        cursor:          'pointer',
                        borderBottom:    '1px solid rgba(255,255,255,0.04)',
                        backgroundColor: isSelected ? 'rgba(56,189,248,0.08)' : 'transparent',
                        borderLeft:      isSelected ? '3px solid #38bdf8' : '3px solid transparent',
                        transition:      'all 0.15s',
                        alignItems:      'center',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* Avatar */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontSize: 12, fontWeight: 700 }}>
                          {initials}
                        </div>
                        <span style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', backgroundColor: statusCfg.color, border: '2px solid #1e293b' }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chat.user?.fullName || 'User'}
                          </p>
                          <span style={{ color: '#475569', fontSize: 10, flexShrink: 0 }}>
                            {dateStr(chat.lastMessageAt)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ color: '#64748b', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {chat.lastMessage || 'No messages yet'}
                          </p>
                          {chat.unreadByAdmin > 0 && (
                            <span style={{ marginLeft: 6, minWidth: 16, height: 16, borderRadius: 99, backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', padding: '0 4px', flexShrink: 0 }}>
                              {chat.unreadByAdmin}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right: message panel ── */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selected ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <MessageCircle size={48} color="#334155" />
                <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Select a chat to start replying</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontSize: 12, fontWeight: 700 }}>
                      {selected.user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U'}
                    </div>
                    <div>
                      <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>
                        {selected.user?.fullName}
                      </p>
                      <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>
                        {selected.user?.email}
                        {' · '}
                        <span style={{ color: STATUS_CFG[selected.status]?.color }}>
                          {STATUS_CFG[selected.status]?.label}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {selected.status !== 'closed' && (
                      <button
                        onClick={closeChat}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <X size={13} /> Close Chat
                      </button>
                    )}
                    <button
                      onClick={() => fetchChat(selected._id, true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {msgLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                      <Loader size={20} color="#38bdf8" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isUser     = msg.sender === 'user';
                      const isBot      = msg.sender === 'bot';
                      const isAdmin    = msg.sender === 'admin';
                      const showLabel  = i === 0 || messages[i-1]?.sender !== msg.sender;

                      return (
                        <div key={msg._id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                          {showLabel && (
                            <p style={{ color: '#475569', fontSize: 10, fontWeight: 600, margin: '0 0 4px', padding: '0 4px' }}>
                              {isUser ? selected.user?.fullName : isBot ? 'Bot (Auto-reply)' : 'You (Admin)'}
                            </p>
                          )}
                          <div style={{
                            maxWidth:        '70%',
                            padding:         '10px 16px',
                            borderRadius:    isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            backgroundColor: isAdmin ? '#38bdf8'
                                           : isBot   ? 'rgba(255,255,255,0.06)'
                                           :           '#334155',
                            color:           isAdmin ? '#0f172a' : '#f1f5f9',
                            fontSize:        13,
                            lineHeight:      1.6,
                            wordBreak:       'break-word',
                          }}>
                            {isBot && (
                              <p style={{ fontSize: 10, color: '#f59e0b', margin: '0 0 4px', fontWeight: 600 }}>
                                🤖 Automated Reply
                              </p>
                            )}
                            {msg.text}
                          </div>
                          <p style={{ color: '#334155', fontSize: 10, margin: '3px 0 0', padding: '0 4px' }}>
                            {timeStr(msg.createdAt)}
                            {isAdmin && (
                              <span style={{ marginLeft: 4, color: msg.readByUser ? '#38bdf8' : '#475569' }}>
                                {msg.readByUser ? '✓✓ Seen' : '✓ Sent'}
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                {selected.status !== 'closed' ? (
                  <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0, backgroundColor: '#0f172a' }}>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Reply to ${selected.user?.fullName}...`}
                      rows={1}
                      style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#f1f5f9', fontSize: 13, outline: 'none', fontFamily: "'DM Sans', sans-serif", resize: 'none', maxHeight: 120, lineHeight: 1.5 }}
                      onFocus={e => e.target.style.borderColor = '#f59e0b'}
                      onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      onInput={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || sending}
                      style={{ width: 42, height: 42, borderRadius: 12, border: 'none', cursor: (!input.trim() || sending) ? 'not-allowed' : 'pointer', backgroundColor: (!input.trim() || sending) ? '#334155' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', opacity: (!input.trim() || sending) ? 0.5 : 1 }}
                    >
                      {sending
                        ? <Loader size={16} color="#0f172a" style={{ animation: 'spin 1s linear infinite' }} />
                        : <Send size={16} color="#0f172a" />
                      }
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#475569', fontSize: 13, flexShrink: 0 }}>
                    This chat is closed
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}