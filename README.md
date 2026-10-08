# CoastRoots
Direct from Konkan shores to your doorstep. A MERN marketplace for Konkan producers.

## Run it
Needs Node 18+ and MongoDB (local or Atlas).

```bash
# 1. API
cd server && cp .env.example .env     # set MONGO_URI and JWT_SECRET
npm install
npm run seed                          # demo sellers + 12 products
npm run dev                           # http://localhost:5000

# 2. Web (new terminal)
cd client && npm install && npm run dev   # http://localhost:5173
```

Demo logins (password `password123`): `admin@coastroots.in`, `buyer@coastroots.in`, `devgad@coastroots.in` (seller).

## What's built
- JWT auth with buyer, seller and admin roles; seller sign-up needs admin approval
- Catalogue: search, category/district/price filters, sort, pagination, in-season filter
- Product page: origin, batch date, seasonal badge, seller story, reviews, recommendations
- Cart, checkout, pincode delivery check, perishable shipping rules, COD and Razorpay (test mode)
- Order tracking, buyer cancellation (restores stock), seller order status updates
- Reviews only after delivery, with lexicon-based sentiment tags
- Seller analytics (revenue trend, top products, next-month estimate), admin panel
- Role-based landing portal directing users as Buyer, Seller, or Administrator

## Razorpay test mode
Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from the Razorpay dashboard (test keys) to `server/.env`. Without them, checkout falls back to cash on delivery.

## Where to extend
Replace `sentiment()` in `server/routes/reviews.js` and the forecast in `server/routes/orders.js` with a Python/Flask ML service. Add Cloudinary uploads, Nodemailer order emails and PDF invoices.
