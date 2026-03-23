import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    fromUser:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    toUser:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    amount:      { type: Number, required: true, min: 0.01 },
    type:        { type: String, enum: ['transfer', 'deposit', 'withdrawal', 'fund', 'debit'], required: true },
    status:      { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    description: { type: String, default: '' },
    note:        { type: String, default: '' },
    reference:   { type: String, unique: true },
  },
  { timestamps: true }
);

// Auto-generate reference
transactionSchema.pre('save', function () {
  if (!this.reference) {
    this.reference =
      'TXN' +
      Date.now().toString() +
      Math.random().toString(36).substring(2, 8).toUpperCase();
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;