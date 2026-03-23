import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema(
  {
    user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symbol:       { type: String, required: true },
    name:         { type: String, required: true },
    assetType:    { type: String, enum: ['crypto', 'forex', 'stock', 'commodity'], required: true },
    action:       { type: String, enum: ['buy', 'sell'], required: true },
    quantity:     { type: Number, required: true, min: 0 },
    priceAtTrade: { type: Number, required: true },
    total:        { type: Number, required: true },
    status:       { type: String, enum: ['open', 'closed'], default: 'open' },
    outcome:      { type: String, enum: ['pending', 'win', 'loss'], default: 'pending' },
    returnAmount: { type: Number, default: 0 },
    profitLoss:   { type: Number, default: 0 },
    adminNote:    { type: String, default: '' },
    resolvedAt:   { type: Date },
    resolvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Trade = mongoose.model('Trade', tradeSchema);
export default Trade;