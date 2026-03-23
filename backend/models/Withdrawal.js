import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema(
  {
    user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName:       { type: String, required: true },
    accountNumber:  { type: String, required: true },
    bankName:       { type: String, required: true },
    amount:         { type: Number, required: true, min: 1 },
    reason:         { type: String, required: true },
    proofImage1:    { type: String, required: true },  // base64 or file path
    proofImage2:    { type: String, default: '' },
    status:         { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNote:      { type: String, default: '' },
    reviewedAt:     { type: Date },
    reviewedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
export default Withdrawal;