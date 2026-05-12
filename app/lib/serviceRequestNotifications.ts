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

const buildProviderUrl = (master: MasterRow, input: NotifyServiceRequestInput) => {
  const origin = input.requestUrl
    ? new URL(input.requestUrl).origin
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://mykakheti.ge';
  return new URL(`/community/masters/${master.id}`, origin).toString();
};

const buildRequesterEmailText = (input: NotifyServiceRequestInput, masters: MasterRow[]) => {
  const providerLines = masters.map((master, index) => (
    `${index + 1}. ${master.full_name} - ${master.profession}\n${buildProviderUrl(master, input)}`
  ));

  return [
    'გამარჯობა,',
    '',
    'თქვენი სერვისის მოთხოვნა MyKakheti.ge-ზე მიღებულია.',
    '',
    `სერვისი: ${input.services.join(', ')}`,
    `მუნიციპალიტეტი: ${input.location}`,
    '',
    'ამავე კატეგორიაში რეგისტრირებული სერვისის მიმწოდებლები:',
    '',
    ...providerLines,
    '',
    'პატივისცემით,',
    'MyKakheti.ge',
  ].join('\n');
};

const buildRequesterEmailHtml = (input: NotifyServiceRequestInput, masters: MasterRow[]) => {
  const providerItems = masters.map((master) => {
    const url = buildProviderUrl(master, input);
    return `
      <li style="margin:0 0 14px;">
        <div style="font-weight:700;color:#111827;">${escapeHtml(master.full_name)}</div>
        <div style="font-size:13px;color:#4b5563;margin:3px 0 7px;">${escapeHtml(master.profession)}</div>
        <a href="${escapeHtml(url)}" style="color:#a47516;font-weight:700;text-decoration:none;">პროფილის ნახვა</a>
      </li>
    `;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; background:#f6f7fb; color:#111827; padding:24px;">
      <div style="max-width:640px; margin:0 auto; border:1px solid #e5e7eb; border-radius:16px; padding:24px; background:#ffffff;">
        <div style="font-size:13px; letter-spacing:0.08em; text-transform:uppercase; color:#a47516; font-weight:700;">MyKakheti.ge</div>
        <h1 style="font-size:22px; margin:10px 0 16px; color:#111827;">შესაბამისი სერვისის მიმწოდებლები</h1>
        <p style="font-size:15px; line-height:1.7; color:#374151;">თქვენი სერვისის მოთხოვნა მიღებულია.</p>
        <div style="margin:18px 0; border:1px solid #eef0f4; border-radius:12px; padding:16px; background:#fafafa;">
          <p style="margin:0 0 8px; font-size:14px;"><strong>სერვისი:</strong> ${escapeHtml(input.services.join(', '))}</p>
          <p style="margin:0; font-size:14px;"><strong>მუნიციპალიტეტი:</strong> ${escapeHtml(input.location)}</p>
        </div>
        <p style="font-size:15px; line-height:1.7; color:#374151;">ამავე კატეგორიაში რეგისტრირებული სერვისის მიმწოდებლები:</p>
        <ul style="padding-left:20px;margin:16px 0;">${providerItems}</ul>
        <p style="margin-top:22px; font-size:14px; color:#374151;">პატივისცემით,<br />MyKakheti.ge</p>
      </div>
    </div>
  `;
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

const sendRequesterProviderSuggestions = async (masters: MasterRow[], input: NotifyServiceRequestInput) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !input.requesterEmail || masters.length === 0) return false;

  const resend = new Resend(apiKey);
  const providers = masters.slice(0, 10);
  const { error } = await resend.emails.send({
    from: 'MyKakheti <no-reply@mykakheti.ge>',
    to: input.requesterEmail,
    subject: 'MyKakheti.ge - შესაბამისი სერვისის მიმწოდებლები',
    text: buildRequesterEmailText(input, providers),
    html: buildRequesterEmailHtml(input, providers),
  });

  if (error) {
    console.warn('[service-request-notifications] requester email failed', error.message);
    return false;
  }

  return true;
};

export const notifyMatchingServiceProviders = async (input: NotifyServiceRequestInput) => {
  const { data, error } = await input.supabase
    .from('masters')
    .select('id,full_name,profession,category,email,notify_by_email,phone,location,user_id,is_approved')
    .eq('is_approved', true)
    .limit(500);

  if (error) {
    console.warn('[service-request-notifications] masters lookup failed', error.message);
    return { matched: 0, sent: 0 };
  }

  const matchingMasters = ((data ?? []) as MasterRow[])
    .filter((master) => masterMatchesRequest(master, input.category, input.services));

  if (matchingMasters.length === 0) {
    return { matched: 0, sent: 0, failed: 0, requesterSent: false };
  }

  const requesterSent = await sendRequesterProviderSuggestions(matchingMasters, input).catch((error) => {
    console.warn('[service-request-notifications] requester suggestions email error', error);
    return false;
  });

  const providerRecipients = matchingMasters
    .filter((master) => master.email && master.notify_by_email)
    .slice(0, 25);

  const { data: existingLogs } = input.requestId
    ? await input.supabase
        .from('service_request_notification_logs')
        .select('provider_id')
        .eq('service_request_id', input.requestId)
    : { data: [] as Array<{ provider_id: string | null }> };
  const alreadyNotified = new Set((existingLogs ?? []).map((log) => log.provider_id).filter(Boolean));
  const pendingMasters = providerRecipients.filter((master) => !alreadyNotified.has(master.id));

  if (pendingMasters.length === 0) {
    return { matched: matchingMasters.length, sent: 0, failed: 0, requesterSent };
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

  return { matched: matchingMasters.length, sent, failed, requesterSent };
};
