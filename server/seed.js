import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Product from './models/Product.js';

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User.deleteMany({}), Product.deleteMany({})]);
const pw = await bcrypt.hash('password123', 10);

await User.create({ name: 'Admin', email: 'admin@coastroots.in', password: pw, role: 'admin' });
await User.create({ name: 'Test Buyer', email: 'buyer@coastroots.in', password: pw, role: 'buyer' });
const s1 = await User.create({
  name: 'Sadanand Gawade',
  email: 'devgad@coastroots.in',
  password: pw,
  role: 'seller',
  seller: {
    shopName: 'Gawade Orchards',
    village: 'Devgad',
    district: 'Sindhudurg',
    approved: true,
    story: 'Three generations of Alphonso growers on the laterite plateaus above Devgad. Mangoes are ripened naturally in paddy straw, never with carbide.',
  },
});
const s2 = await User.create({
  name: 'Sunita Parab',
  email: 'malvan@coastroots.in',
  password: pw,
  role: 'seller',
  seller: {
    shopName: 'Sunita’s Malvani Kitchen',
    village: 'Malvan',
    district: 'Sindhudurg',
    approved: true,
    story: 'A women’s self-help group in Malvan grinding masalas the slow way: sun-dried chillies, stone-pounded, small batches.',
  },
});
const s3 = await User.create({
  name: 'Rohan Kadam',
  email: 'ratnagiri@coastroots.in',
  password: pw,
  role: 'seller',
  seller: {
    shopName: 'Kadam Coastal Foods',
    village: 'Guhagar',
    district: 'Ratnagiri',
    approved: true,
    story: 'Cashews, kokum and dried fish from the Guhagar coast, processed within a day of harvest.',
  },
});

const mk = (s, name, category, price, unit, stock, emoji, image, description, extra = {}) => ({
  name,
  category,
  price,
  unit,
  stock,
  emoji,
  image,
  description,
  seller: s._id,
  village: s.seller.village,
  district: s.seller.district,
  approved: true,
  batchDate: new Date(),
  ...extra,
});

await Product.insertMany([
  mk(
    s1,
    'Devgad Alphonso Mangoes (12 pcs)',
    'Fruits',
    1499,
    'box',
    40,
    '🥭',
    '/images/product_mango_box.jpg',
    'Naturally ripened Devgad hapus, graded by size and hand-packed in clean paddy straw. Sweet, saffron-golden pulp with GI certification.',
    { perishable: true, seasonFrom: 4, seasonTo: 6 }
  ),
  mk(
    s1,
    'Raw Mango Aamras Pulp',
    'Fruits',
    349,
    '1 kg',
    60,
    '🥭',
    '/images/product_aamras.jpg',
    'Cold-extracted Alphonso puree with zero added sugar or artificial preservatives. Retains natural orchard aroma.',
    { seasonFrom: 4, seasonTo: 7 }
  ),
  mk(
    s2,
    'Malvani Masala',
    'Spices',
    220,
    '250 g',
    120,
    '🌶️',
    '/images/product_malvani_masala.jpg',
    'The quintessential coastal curry masala: stone-pounded with sun-dried Byadgi chillies, fragrant coriander, and 18 roasted spices.'
  ),
  mk(
    s2,
    'Goda Masala',
    'Spices',
    190,
    '200 g',
    90,
    '🫚',
    '/images/product_goda_masala.jpg',
    'Mild, aromatic coconut-roasted spice blend with stone flower (dagad phool) and sesame for traditional Maharashtrian curries and dals.'
  ),
  mk(
    s2,
    'Kombdi Vade Flour Mix',
    'Ready Mixes',
    160,
    '500 g',
    70,
    '🍚',
    '/images/product_vade_mix.jpg',
    'Authentic multi-grain rice and lentil flour blend with methi and cumin for fluffy, golden Malvani puri-style vade.'
  ),
  mk(
    s3,
    'Roasted Cashews, Vengurla',
    'Dry Fruits',
    780,
    '500 g',
    80,
    '🥜',
    '/images/product_roasted_cashews.jpg',
    'Whole W-240 grade Vengurla cashews, traditional wood-fire roasted with a light sea salt touch for rich, buttery crunch.'
  ),
  mk(
    s3,
    'Aagal Kokum (Dried)',
    'Dry Fruits',
    260,
    '250 g',
    100,
    '🍇',
    '/images/product_dried_kokum.jpg',
    'Deep purple sun-dried kokum rinds from Guhagar hills with natural tartness. Essential for authentic solkadhi and fish curries.',
    { seasonFrom: 3, seasonTo: 5 }
  ),
  mk(
    s3,
    'Kokum Sharbat Concentrate',
    'Beverages',
    210,
    '500 ml',
    90,
    '🍹',
    'https://images.unsplash.com/photo-1601390395693-364c0e22031a?w=700&auto=format&fit=crop&q=80',
    'Handmade cooling kokum squash with roasted cumin and black salt. Natural digestive refresher for hot summer afternoons.'
  ),
  mk(
    s3,
    'Dried Bombil (Bombay Duck)',
    'Dried Fish',
    420,
    '250 g',
    50,
    '🐟',
    'https://images.unsplash.com/photo-1610899998589-fd27ae6e676a?w=700&auto=format&fit=crop&q=80',
    'Fresh catch sun-dried on clean coastal bamboo scaffolds. Crisp texture when pan-fried with rava; packed airtight.',
    { perishable: false }
  ),
  mk(
    s3,
    'Dried Surmai Slices',
    'Dried Fish',
    640,
    '250 g',
    35,
    '🐟',
    'https://images.unsplash.com/photo-1601314002592-b8734bca6604?w=700&auto=format&fit=crop&q=80',
    'Prime kingfish (Surmai) steaks cured with sea salt and sun-dried on the Ratnagiri shoreline.'
  ),
  mk(
    s1,
    'Cold-pressed Coconut Oil',
    'Pantry',
    380,
    '500 ml',
    75,
    '🥥',
    'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=700&auto=format&fit=crop&q=80',
    'Single-estate wood-pressed (lakdi ghana) virgin coconut oil from mature Sindhudurg coconuts. Fragrant, unrefined, and edible grade.'
  ),
  mk(
    s2,
    'Ukadiche Modak Rice Flour',
    'Pantry',
    140,
    '500 g',
    85,
    '🌾',
    'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=700&auto=format&fit=crop&q=80',
    'Silky soft, steam-ground fragrant Basmati-blend rice flour designed specifically for tender, non-sticky ukadiche modaks.'
  ),
]);

console.log('Seeded successfully with high-resolution Konkan product photography.');
console.log('Logins (password: password123): admin@coastroots.in, buyer@coastroots.in, devgad@coastroots.in');
await mongoose.disconnect();
