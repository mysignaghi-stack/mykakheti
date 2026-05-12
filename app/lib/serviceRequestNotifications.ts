import { Resend } from 'resend';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type MasterRow = Database['public']['Tables']['masters']['Row'];
type NotificationLogInsert = Database['public']['Tables']['service_request_notification_logs']['Insert'];

type NotifyServiceRequestInput = {
  supabase: SupabaseClient<Database>;
  requestId: string | null;
  requesterEmail?: string | null;
  requestUrl?: string;
  category: string;
  services: string[];
  location: string;
  budget: string;
  phone: string;
  description: string;
};

const normalizeListText = (value: string | null | undefined) => (
  (value ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
);

const splitStoredList = (value: string | null | undefined) => (
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
);

const normalizePhoneForWhatsApp = (value: string | null | undefined) => {
  const digits = (value ?? '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('995') && digits.length >= 12) return digits;
  if (digits.length === 9 && digits.startsWith('5')) return `995${digits}`;
  if (digits.length === 10 && digits.startsWith('0')) return `995${digits.slice(1)}`;
  return digits.length >= 11 ? digits : null;
};

const escapeHtml = (value: string) => (
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
);

const masterMatchesRequest = (master: MasterRow, category: string, services: string[]) => {
  const masterCategories = splitStoredList(master.category).map(normalizeListText);
  const masterServices = splitStoredList(master.profession).map(normalizeListText);
  const normalizedCategory = normalizeListText(category);
  const normalizedServices = services.map(normalizeListText).filter((service) => service !== normalizeListText('ყველა სერვისი'));

  return (
    masterCategories.includes(normalizedCategory) ||
    normalizedServices.some((service) => masterServices.includes(service))
  );
};

const buildEmailText = (input: NotifyServiceRequestInput) => {
  const lines = [
    'გამარჯობა,',
    '',
    'MyKakheti.ge-ზე მომხმარებელი ეძებს სერვისს, რომელიც შეიძლება შეესაბამებოდეს თქვენს მომსახურებას.',
    '',
    `სერვისი: ${input.services.join(', ')}`,
    `მუნიციპალიტეტი: ${input.location}`,
    `მოთხოვნის აღწერა: ${input.description}`,
    '',
    input.requestUrl ? 'დეტალების სანახავად გადადით ბმულზე:' : '',
    input.requestUrl ?? '',
    '',
    'თუ აღარ გსურთ მსგავსი შეტყობინებების მიღება, შეცვალეთ შეტყობინებების პარამეტრები თქვენს პროფილში.',
    '',
    'პატივისცემით,',
    'MyKakheti.ge',
  ].filter((line) => line !== '');

  return lines.join('\n');
};

const buildEmailHtml = (input: NotifyServiceRequestInput) => {
  const requestLink = input.requestUrl
    ? `<p style="margin:18px 0 0;"><a href="${escapeHtml(input.requestUrl)}" style="display:inline-block;background:#d6a93a;color:#111827;text-decoration:none;border-radius:10px;padding:10px 14px;font-weight:700;">დეტალების ნახვა</a></p>`
    : '';

  return `
    <div style="font-family: Arial, sans-serif; background:#f6f7fb; color:#111827; padding:24px;">
      <div style="max-width:640px; margin:0 auto; border:1px solid #e5e7eb; border-radius:16px; padding:24px; background:#ffffff;">
        <div style="font-size:13px; letter-spacing:0.08em; text-transform:uppercase; color:#a47516; font-weight:700;">MyKakheti.ge</div>
        <h1 style="font-size:22px; margin:10px 0 16px; color:#111827;">მომხმარებელი ეძებს თქვენს სერვისს</h1>
        <p style="font-size:15px; line-height:1.7; color:#374151;">გამარჯობა,</p>
        <p style="font-size:15px; line-height:1.7; color:#374151;">MyKakheti.ge-ზე მომხმარებელი ეძებს სერვისს, რომელიც შეიძლება შეესაბამებოდეს თქვენს მომსახურებას.</p>
        <div style="margin:18px 0; border:1px solid #eef0f4; border-radius:12px; padding:16px; background:#fafafa;">
          <p style="margin:0 0 8px; font-size:14px;"><strong>სერვისი:</strong> ${escapeHtml(input.services.join(', '))}</p>
          <p style="margin:0 0 8px; font-size:14px;"><strong>მუნიციპალიტეტი:</strong> ${escapeHtml(input.location)}</p>
          <p style="margin:0; font-size:14px; line-height:1.6;"><strong>მოთხოვნის აღწერა:</strong> ${escapeHtml(input.description)}</p>
        </div>
        <p style="font-size:15px; line-height:1.7; color:#374151;">დეტალების სანახავად გადადით ბმულზე:</p>
        ${requestLink}
        <p style="margin-top:22px; font-size:13px; line-height:1.6; color:#6b7280;">თუ აღარ გსურთ მსგავსი შეტყობინებების მიღება, შეცვალეთ შეტყობინებების პარამეტრები თქვენს პროფილში.</p>
        <p style="margin-top:22px; font-size:14px; color:#374151;">პატივისცემით,<br />MyKakheti.ge</p>
      </div>
    </div>
  `;
};

const sendWhatsAppText = async (to: string, message: string) => {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return false;

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: false,
        body: message,
      },
    }),
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => '');
    console.warn('[service-request-notifications] WhatsApp send failed', response.status, payload);
    return false;
  }

  return true;
};

const sendWebhookNotification = async (masters: MasterRow[], message: string, input: NotifyServiceRequestInput) => {
  const webhookUrl = process.env.SERVICE_REQUEST_NOTIFICATION_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'service_request_created',
      requestId: input.requestId,
      category: input.category,
      services: input.services,
      location: input.location,
      budget: input.budget,
      requesterPhone: input.phone,
      requesterEmail: input.requesterEmail,
      description: input.description,
      message,
      recipients: masters.map((master) => ({
        id: master.id,
        name: master.full_name,
        phone: master.phone,
        profession: master.profession,
        category: master.category,
      })),
    }),
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => '');
    console.warn('[service-request-notifications] webhook failed', response.status, payload);
    return false;
  }

  return true;
};

const writeNotificationLogs = async (supabase: SupabaseClient<Database>, logs: NotificationLogInsert[]) => {
  if (logs.length === 0) return;
  const { error } = await supabase
    .from('service_request_notification_logs')
    .insert(logs);

  if (error) {
    console.warn('[service-request-notifications] log insert failed', error.message);
  }
};

const sendEmailNotifications = async (supabase: SupabaseClient<Database>, masters: MasterRow[], input: NotifyServiceRequestInput) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = 'MyKakheti <no-reply@mykakheti.ge>';
  if (!apiKey) {
    console.warn('[service-request-notifications] RESEND_API_KEY is missing; email notifications were not sent.');
    await writeNotificationLogs(supabase, masters.map((master) => ({
      service_request_id: input.requestId,
      provider_id: master.id,
      email: master.email,
      status: 'failed',
      error_message: 'RESEND_API_KEY is missing',
    })));
    return { sent: 0, failed: masters.length };
  }

  const resend = new Resend(apiKey);
  const subject = 'MyKakheti.ge-ზე მომხმარებელი ეძებს თქვენს სერვისს';
  const text = buildEmailText(input);
  const html = buildEmailHtml(input);
  let sent = 0;
  let failed = 0;
  const logs: NotificationLogInsert[] = [];

  for (const master of masters) {
    try {
      const { error } = await resend.emails.send({
        from,
        to: master.email!,
        subject,
        text,
        html,
      });
      if (error) throw new Error(error.message);
      sent += 1;
      logs.push({
        service_request_id: input.requestId,
        provider_id: master.id,
        email: master.email,
        status: 'sent',
        error_message: null,
      });
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : 'Unknown Resend error';
      console.warn('[service-request-notifications] email failed', message);
      logs.push({
        service_request_id: input.requestId,
        provider_id: master.id,
        email: master.email,
        status: 'failed',
        error_message: message,
      });
    }
  }

  await writeNotificationLogs(supabase, logs);
  return { sent, failed };
};

export const notifyMatchingServiceProviders = async (input: NotifyServiceRequestInput) => {
  const { data, error } = await input.supabase
    .from('masters')
    .select('id,full_name,profession,category,email,notify_by_email,phone,location,user_id,is_approved')
    .eq('is_approved', true)
    .eq('notify_by_email', true)
    .not('email', 'is', null)
    .limit(500);

  if (error) {
    console.warn('[service-request-notifications] masters lookup failed', error.message);
    return { matched: 0, sent: 0 };
  }

  const matchingMasters = (data ?? [])
    .filter((master) => master.email && master.notify_by_email && masterMatchesRequest(master as MasterRow, input.category, input.services))
    .slice(0, 25) as MasterRow[];

  if (matchingMasters.length === 0) {
    return { matched: 0, sent: 0 };
  }

  const { data: existingLogs } = input.requestId
    ? await input.supabase
        .from('service_request_notification_logs')
        .select('provider_id')
        .eq('service_request_id', input.requestId)
    : { data: [] as Array<{ provider_id: string | null }> };
  const alreadyNotified = new Set((existingLogs ?? []).map((log) => log.provider_id).filter(Boolean));
  const pendingMasters = matchingMasters.filter((master) => !alreadyNotified.has(master.id));

  if (pendingMasters.length === 0) {
    return { matched: matchingMasters.length, sent: 0, failed: 0 };
  }

  const message = buildEmailText(input);
  let sent = 0;
  let failed = 0;

  await sendWebhookNotification(pendingMasters, message, input).catch((error) => {
    console.warn('[service-request-notifications] webhook error', error);
  });

  {
    const result = await sendEmailNotifications(input.supabase, pendingMasters, input).catch((error) => {
      console.warn('[service-request-notifications] email error', error);
      return { sent: 0, failed: pendingMasters.length };
    });
    sent += result.sent;
    failed += result.failed;
  }

  if (process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID) {
    const uniquePhones = Array.from(new Set(
      pendingMasters
        .map((master) => normalizePhoneForWhatsApp(master.phone))
        .filter((phone): phone is string => Boolean(phone))
    ));

    for (const phone of uniquePhones) {
      const ok = await sendWhatsAppText(phone, message).catch((error) => {
        console.warn('[service-request-notifications] WhatsApp error', error);
        return false;
      });
      if (ok) sent += 1;
    }
  }

  return { matched: matchingMasters.length, sent, failed };
};
