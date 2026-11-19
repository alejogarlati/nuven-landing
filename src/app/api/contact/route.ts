import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const ipRequests = new Map<string, { count: number; resetAt: number }>();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHeaderBreaks(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequests.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }
  entry.count += 1;
  return false;
}

export async function POST(request: Request) {
  try {
    const clientIp =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor intenta más tarde.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Solicitud inválida' },
        { status: 400 },
      );
    }

    const rawNombre = body.nombre;
    const rawEmail = body.email;
    const rawTelefono = body.telefono;
    const rawDescripcion = body.descripcion;
    const rawTurnstileToken = body.turnstileToken;

    if (
      typeof rawNombre !== 'string' ||
      typeof rawEmail !== 'string' ||
      typeof rawDescripcion !== 'string' ||
      typeof rawTurnstileToken !== 'string' ||
      (rawTelefono !== undefined && typeof rawTelefono !== 'string')
    ) {
      return NextResponse.json(
        { error: 'Formato de campos inválido' },
        { status: 400 },
      );
    }

    const nombre = stripHeaderBreaks(rawNombre);
    const email = stripHeaderBreaks(rawEmail);
    const telefono = rawTelefono ? stripHeaderBreaks(rawTelefono) : '';
    const descripcion = rawDescripcion.trim();
    const turnstileToken = rawTurnstileToken.trim();

    if (
      !nombre ||
      nombre.length > 120 ||
      !email ||
      email.length > 254 ||
      !EMAIL_RE.test(email) ||
      telefono.length > 40 ||
      !descripcion ||
      descripcion.length > 3000 ||
      !turnstileToken ||
      turnstileToken.length > 2048
    ) {
      return NextResponse.json(
        { error: 'Por favor revisa los datos ingresados' },
        { status: 400 },
      );
    }

    // 0. Environment Validation
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (!turnstileSecret) {
      console.error('Missing TURNSTILE_SECRET_KEY');
      return NextResponse.json(
        { error: 'Error de configuración del servidor (Turnstile)' },
        { status: 500 },
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY');
      return NextResponse.json(
        { error: 'Error de configuración del servidor (Resend)' },
        { status: 500 },
      );
    }

    // 1. Validate Turnstile Token
    const verifyResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${encodeURIComponent(
          turnstileSecret,
        )}&response=${encodeURIComponent(turnstileToken)}`,
      },
    );

    const verifyData = await verifyResponse.json();

    if (!verifyData.success) {
      console.error('Turnstile verification failed:', verifyData);
      return NextResponse.json(
        { error: 'La verificación de seguridad ha fallado' },
        { status: 400 },
      );
    }

    // 2. Send Email via Resend
    const resend = new Resend(resendApiKey);
    const recipient =
      process.env.CONTACT_RECIPIENT_EMAIL || 'contacto@nuven.com.ar';
    const { error } = await resend.emails.send({
      from: 'Nuven Contact <contacto@nuven.com.ar>',
      to: [recipient],
      subject: `Nuevo mensaje de contacto: ${nombre}`,
      replyTo: email,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(telefono || 'No proporcionado')}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${escapeHtml(descripcion).replace(/\n/g, '<br />')}</p>
      `,
    });

    if (error) {
      console.error('Resend error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'No se pudo enviar el correo electrónico' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
