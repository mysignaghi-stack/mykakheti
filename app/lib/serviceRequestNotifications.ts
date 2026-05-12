import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type MasterRow = Database['public']['Tables']['masters']['Row'];

type NotifyServiceRequestInput = {
  supabase: SupabaseClient<Database>;
  requestId: string | null;
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

const masterMatchesRequest = (master: MasterRow, category: string, services: string[]) => {
  const masterCategories = splitStoredList(master.category).map(normalizeListText);
  const masterServices = splitStoredList(master.profession).map(normalizeListText);
  const normalizedCategory = normalizeListText(category);
  const normalizedServices = services.map(normalizeListText);

  return (
    masterCategories.includes(normalizedCategory) ||
    normalizedServices.some((service) => masterServices.includes(service))
  );
};

const buildMessage = (input: NotifyServiceRequestInput) => {
  const lines = [
    'MyKakheti: მომხმარებელი ეძებს თქვენს სერვისს.',
    `კატეგორია: ${input.category}`,
    `სერვისი: ${input.services.join(', ')}`,
    `ლოკაცია: ${input.location}`,
    input.budget ? `ბიუჯეტი: ${input.budget}` : '',
    `საკონტაქტო: ${input.phone}`,
    '',
    input.description.slice(0, 500),
  ].filter(Boolean);

  return lines.join('\n');
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

export const notifyMatchingServiceProviders = async (input: NotifyServiceRequestInput) => {
  const { data, error } = await input.supabase
    .from('masters')
    .select('id,full_name,profession,category,phone,is_approved')
    .eq('is_approved', true)
    .not('phone', 'is', null)
    .limit(500);

  if (error) {
    console.warn('[service-request-notifications] masters lookup failed', error.message);
    return { matched: 0, sent: 0 };
  }

  const matchingMasters = (data ?? [])
    .filter((master) => master.phone && masterMatchesRequest(master as MasterRow, input.category, input.services))
    .slice(0, 25) as MasterRow[];

  if (matchingMasters.length === 0) {
    return { matched: 0, sent: 0 };
  }

  const message = buildMessage(input);
  let sent = 0;

  await sendWebhookNotification(matchingMasters, message, input).catch((error) => {
    console.warn('[service-request-notifications] webhook error', error);
  });

  if (process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID) {
    const uniquePhones = Array.from(new Set(
      matchingMasters
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

  return { matched: matchingMasters.length, sent };
};
