import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender:    { type: String, enum: ['user', 'bot', 'admin'], required: true },
  text:      { type: String, required: true },
  readByAdmin: { type: Boolean, default: false },
  readByUser:  { type: Boolean, default: false },
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [messageSchema],
  status:   { type: String, enum: ['open', 'active', 'closed'], default: 'open' },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  unreadByAdmin: { type: Number, default: 0 },
  unreadByUser:  { type: Number, default: 0 },
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;