export async function onRequestPost(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://hireamagician.com',
  };

  try {
    const body = await context.request.json();

    // Basic validation
    const { name, email, event_type, event_date, guests, message } = body;
    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Name and email are required.' }), {
        status: 400,
        headers,
      });
    }

    // Simple email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address.' }), {
        status: 400,
        headers,
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Hire a Magician <enquiry@hireamagician.com>',
        to: 'dan@hireamagician.com',
        reply_to: email,
        subject: `New Enquiry from ${name}`,
        html: `
          <h2>New Enquiry from hireamagician.com</h2>
          <table style="border-collapse:collapse;font-family:sans-serif;">
            <tr><td style="padding:6px 12px;font-weight:bold;">Name</td><td style="padding:6px 12px;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;">Email</td><td style="padding:6px 12px;">${escapeHtml(email)}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;">Event Type</td><td style="padding:6px 12px;">${escapeHtml(event_type || 'Not specified')}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;">Event Date</td><td style="padding:6px 12px;">${escapeHtml(event_date || 'Not specified')}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;">Guests</td><td style="padding:6px 12px;">${escapeHtml(guests || 'Not specified')}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;">Message</td><td style="padding:6px 12px;">${escapeHtml(message || 'No message')}</td></tr>
          </table>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Resend API error:', error);
      return new Response(JSON.stringify({ error: 'Failed to send email.' }), {
        status: 500,
        headers,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    console.error('Contact form error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers,
    });
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
