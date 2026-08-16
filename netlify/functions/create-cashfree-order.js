// netlify/functions/create-cashfree-order.js
// Creates a Cashfree order server-side (Secret Key stays here, never in frontend code).
// Requires environment variables set in Netlify dashboard:
//   CASHFREE_APP_ID
//   CASHFREE_SECRET_KEY

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { orderId, amount, buyerName, buyerEmail, buyerPhone, returnUrl } = JSON.parse(event.body);

    if (!orderId || !amount || !buyerEmail) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing orderId, amount, or buyerEmail' }) };
    }

    const APP_ID = process.env.CASHFREE_APP_ID;
    const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

    if (!APP_ID || !SECRET_KEY) {
      return { statusCode: 500, body: JSON.stringify({ message: 'Cashfree keys not configured on server' }) };
    }

    // Cashfree requires a 10-digit phone; fall back to a placeholder if buyer skipped it
    const phone = (buyerPhone || '').replace(/\D/g, '').slice(-10) || '9999999999';

    const payload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: orderId,
        customer_name: buyerName || 'Customer',
        customer_email: buyerEmail,
        customer_phone: phone
      },
      order_meta: {
        return_url: returnUrl || 'https://shribeatz.com/?cf_order_id={order_id}'
      }
    };

    const res = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': APP_ID,
        'x-client-secret': SECRET_KEY,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          payment_session_id: data.payment_session_id,
          cf_order_id: data.cf_order_id,
          order_id: data.order_id
        })
      };
    } else {
      return { statusCode: res.status, body: JSON.stringify({ message: data.message || 'Cashfree order creation failed', details: data }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }
};
