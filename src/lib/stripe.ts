import Stripe from "stripe";

// The key is read lazily so the app can boot (and most pages render) without
// Stripe configured; only checkout itself requires it.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder");
