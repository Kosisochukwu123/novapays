import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key:   { type: String, default: 'global', unique: true },
  data:  { type: Object, default: {}  },
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;