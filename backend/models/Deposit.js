import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema(
  {
    user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    network:       { type: String, required: true },
    symbol:        { type: String, required: true },
    walletAddress: { type: String, required: true },
    amount:        { type: Number, default: 0 },
    txHash:        { type: String, default: '' },
    status:        { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
    adminNote:     { type: String, default: '' },
    confirmedAt:   { type: Date },
    confirmedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Deposit = mongoose.model('Deposit', depositSchema);
export default Deposit;