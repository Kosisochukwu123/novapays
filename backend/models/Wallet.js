import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    network:     { type: String, required: true, unique: true },
    symbol:      { type: String, required: true },
    label:       { type: String, required: true },
    address:     { type: String, required: true },
    network_tag: { type: String, default: '' },
    color:       { type: String, default: '#38bdf8' },
    icon:        { type: String, default: 'circle' },
    isActive:    { type: Boolean, default: true },
    minDeposit:  { type: Number, default: 10 },
    confirmations: { type: Number, default: 3 },
    updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;