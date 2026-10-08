import mongoose from 'mongoose';
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: { type: String, required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'pack' },
  stock: { type: Number, default: 0, min: 0 },
  emoji: { type: String, default: '🌴' },
  image: String,
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  village: String,
  district: { type: String, index: true },
  batchDate: Date,
  perishable: { type: Boolean, default: false },
  seasonFrom: { type: Number, min: 1, max: 12 },
  seasonTo: { type: Number, min: 1, max: 12 },
  approved: { type: Boolean, default: false },
  ratingAvg: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
}, { timestamps: true });
productSchema.index({ name: 'text', description: 'text' });
export default mongoose.model('Product', productSchema);
