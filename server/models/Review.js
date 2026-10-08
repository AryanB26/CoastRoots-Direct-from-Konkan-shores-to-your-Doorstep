import mongoose from 'mongoose';
const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String,
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
}, { timestamps: true });
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
export default mongoose.model('Review', reviewSchema);
