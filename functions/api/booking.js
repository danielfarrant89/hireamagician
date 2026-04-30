export async function onRequestPost(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://hireamagician.com',
  };

  try {
    const body = await context.request.json();
    const {
      name, email, company, billing_address,
      event_date, guests, venue_address, dress_code,
      perf_start, perf_end, contact_name, contact_phone,
      referral, notes,
    } = body;

    if (!name || !email || !billing_address || !event_date || !guests ||
        !venue_address || !dress_code || !perf_start || !perf_end ||
        !contact_name || !contact_phone || !referral) {
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400, headers });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address.' }), { status: 400, headers });
    }

    const row = (label, value) =>
      `<tr>
        <td style="padding:8px 16px 8px 0;font-weight:600;white-space:nowrap;vertical-align:top;color:#555;">${label}</td>
        <td style="padding:8px 0 8px 16px;color:#1a1a1a;">${escapeHtml(value || '—')}</td>
      </tr>`;

    const section = (title) =>
      `<tr><td colspan="2" style="padding:20px 0 6px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#c9a84c;border-top:1px solid #eee;">${title}</td></tr>`;

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <div style="background:#111318;padding:28px 32px;margin-bottom:24px;">
          <p style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#c9a84c;margin:0 0 6px;">Dan Farrant – Close Up Magician</p>
          <h2 style="font-size:22px;font-weight:300;color:#fff;margin:0;">New Booking Submission</h2>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;">
          ${section('Client Details')}
          ${row('Name', name)}
          ${row('Email', email)}
          ${row('Company', company || '—')}
          ${row('Billing Address', billing_address.replace(/\n/g, '<br>'))}
          ${section('Event Details')}
          ${row('Date of Event', event_date)}
          ${row('Number of Guests', guests)}
          ${row('Venue Address', venue_address.replace(/\n/g, '<br>'))}
          ${row('Dress Code', dress_code)}
          ${section('Performance')}
          ${row('Start Time', perf_start)}
          ${row('End Time', perf_end)}
          ${row('On-the-Day Contact', contact_name)}
          ${row('Contact Phone', contact_phone)}
          ${section('Other')}
          ${row('How They Found Dan', referral)}
          ${row('Notes', notes ? notes.replace(/\n/g, '<br>') : '—')}
        </table>
        <p style="margin-top:24px;font-size:13px;color:#777;">An .ics calendar file is attached — click it to add this event to your calendar.</p>
      </div>
    `;

    const ics = buildIcs({ name, company, venue_address, event_date, perf_start, perf_end, contact_name, contact_phone, notes });

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
        subject: `New Booking: ${name} – ${event_date}`,
        html,
        attachments: [
          {
            filename: 'booking.ics',
            content: btoa(ics),
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ error: 'Failed to send email.' }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    console.error('Booking form error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), { status: 500, headers });
  }
}

function buildIcs({ name, company, venue_address, event_date, perf_start, perf_end, contact_name, contact_phone, notes }) {
  const dtstart = parseDatetime(event_date, perf_start);
  const dtend   = parseDatetime(event_date, perf_end);
  const uid     = `booking-${Date.now()}@hireamagician.com`;
  const now     = formatIcsDate(new Date());
  const location = venue_address.replace(/\n/g, ', ');
  const summary  = company ? `${name} (${company})` : name;
  const description = [
    `Client: ${name}`,
    company ? `Company: ${company}` : '',
    `Performance: ${perf_start} – ${perf_end}`,
    `On-the-day contact: ${contact_name} – ${contact_phone}`,
    notes ? `Notes: ${notes}` : '',
  ].filter(Boolean).join('\\n');

  // If we couldn't parse times, fall back to an all-day event
  if (!dtstart || !dtend) {
    const dateStr = parseIcsDate(event_date);
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//hireamagician.com//Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateStr}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `LOCATION:${escapeIcs(location)}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//hireamagician.com//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=Europe/London:${dtstart}`,
    `DTEND;TZID=Europe/London:${dtend}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `LOCATION:${escapeIcs(location)}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

// Parse "DD/MM/YYYY" + "7:00pm" → "20250614T190000"
function parseDatetime(dateStr, timeStr) {
  const dateParts = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (!dateParts) return null;
  const [, d, m, y] = dateParts;

  const timeMatch = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!timeMatch) return null;
  let [, h, min = '00', ampm = ''] = timeMatch;
  h = parseInt(h, 10);
  if (ampm.toLowerCase() === 'pm' && h !== 12) h += 12;
  if (ampm.toLowerCase() === 'am' && h === 12) h = 0;

  return `${y}${m.padStart(2,'0')}${d.padStart(2,'0')}T${String(h).padStart(2,'0')}${min.padStart(2,'0')}00`;
}

// Parse "DD/MM/YYYY" → "YYYYMMDD"
function parseIcsDate(dateStr) {
  const m = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (!m) return dateStr.replace(/\D/g, '').slice(0, 8);
  return `${m[3]}${m[2].padStart(2,'0')}${m[1].padStart(2,'0')}`;
}

function formatIcsDate(d) {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcs(str) {
  return String(str).replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
