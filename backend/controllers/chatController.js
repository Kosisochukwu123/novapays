import Chat from '../models/Chat.js';

const BOT_REPLIES = {
  first:  'Hello! 👋 What can I help you with at this time?',
  second: "Thank you for reaching out. Our team member will attend to you shortly. Please hold on! 🙏",
};

// ── USER ──────────────────────────────────────────────────────────────────

// GET /api/user/chat — get or create chat session
export const getUserChat = async (req, res) => {
  try {
    let chat = await Chat.findOne({ user: req.user._id });
    if (!chat) {
      chat = await Chat.create({
        user: req.user._id,
        messages: [],
      });
    }
    res.json({ chat });
  } catch (err) {
    console.error('getUserChat error:', err);
    res.status(500).json({ message: 'Failed to load chat' });
  }
};

// POST /api/user/chat/message — user sends a message
export const userSendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message is required' });

    let chat = await Chat.findOne({ user: req.user._id });
    if (!chat) {
      chat = await Chat.create({ user: req.user._id, messages: [] });
    }

    // Count previous user messages to determine bot reply
    const userMessages = chat.messages.filter(m => m.sender === 'user');
    const isFirstMsg   = userMessages.length === 0;
    const isSecondMsg  = userMessages.length === 1;

    // Add user message
    chat.messages.push({
      sender:      'user',
      text:        text.trim(),
      readByAdmin: false,
      readByUser:  true,
    });

    // Add bot auto-reply
    if (isFirstMsg || isSecondMsg) {
      const botText = isFirstMsg ? BOT_REPLIES.first : BOT_REPLIES.second;
      chat.messages.push({
        sender:      'bot',
        text:        botText,
        readByAdmin: true,
        readByUser:  false,
      });
      chat.unreadByUser += 1;
    }

    chat.status        = 'open';
    chat.lastMessage   = text.trim();
    chat.lastMessageAt = new Date();
    chat.unreadByAdmin += 1;

    await chat.save();
    res.json({ chat });
  } catch (err) {
    console.error('userSendMessage error:', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// PUT /api/user/chat/read — mark admin messages as read by user
export const userMarkRead = async (req, res) => {
  try {
    const chat = await Chat.findOne({ user: req.user._id });
    if (!chat) return res.json({ ok: true });
    chat.messages.forEach(m => {
      if (m.sender !== 'user') m.readByUser = true;
    });
    chat.unreadByUser = 0;
    await chat.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark as read' });
  }
};

// ── ADMIN ─────────────────────────────────────────────────────────────────

// GET /api/admin/chats — all chats
export const adminGetChats = async (req, res) => {
  try {
    const chats = await Chat.find()
      .populate('user', 'fullName email')
      .sort({ lastMessageAt: -1 });
    res.json({ chats });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
};

// GET /api/admin/chats/:id — single chat
export const adminGetChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id).populate('user', 'fullName email');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.json({ chat });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch chat' });
  }
};

// POST /api/admin/chats/:id/message — admin replies
export const adminSendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message is required' });

    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    chat.messages.push({
      sender:      'admin',
      text:        text.trim(),
      readByAdmin: true,
      readByUser:  false,
    });

    chat.status        = 'active';
    chat.lastMessage   = text.trim();
    chat.lastMessageAt = new Date();
    chat.unreadByUser  += 1;

    // Reset admin unread since admin is actively replying
    chat.unreadByAdmin = 0;

    await chat.save();

    const populated = await Chat.findById(chat._id).populate('user', 'fullName email');
    res.json({ chat: populated });
  } catch (err) {
    console.error('adminSendMessage error:', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// PUT /api/admin/chats/:id/read — mark user messages as read by admin
export const adminMarkRead = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.json({ ok: true });
    chat.messages.forEach(m => {
      if (m.sender === 'user') m.readByAdmin = true;
    });
    chat.unreadByAdmin = 0;
    await chat.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark as read' });
  }
};

// PUT /api/admin/chats/:id/close — close a chat
export const adminCloseChat = async (req, res) => {
  try {
    const chat = await Chat.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true }
    ).populate('user', 'fullName email');
    res.json({ chat });
  } catch (err) {
    res.status(500).json({ message: 'Failed to close chat' });
  }
};