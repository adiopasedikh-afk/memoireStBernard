// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';

export async function POST(request: Request) {
  try {
    const { amount } = await request.json(); // Montant saisi en euros (ex: 10, 20)

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Don à l\'association Saint-Bernard',
            },
            // Stripe attend un montant en centimes (10 € = 1000 centimes)
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/faire-un-don/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/faire-un-don`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}