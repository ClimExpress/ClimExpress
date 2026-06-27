const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const { totalCents, description, customerEmail, customerName, metadata } = body;

    if (!totalCents || totalCents < 100) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Montant invalide' }) };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Location climatiseur — ClimExpress Vichy',
              description: description || 'Location de climatiseur mobile',
            },
            unit_amount: totalCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: customerEmail || undefined,
      metadata: metadata || {},
      success_url: `${event.headers.origin || 'https://climexpressvichy.fr'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${event.headers.origin || 'https://climexpressvichy.fr'}/#commande`,
      locale: 'fr',
      payment_intent_data: {
        description: `ClimExpress — ${customerName || 'Client'} — ${description || ''}`,
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
