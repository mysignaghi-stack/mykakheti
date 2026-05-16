export function getAuthErrorMessage(error: unknown): string {
  const message = getRawErrorMessage(error);
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'ელფოსტა ან პაროლი არასწორია.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'ელფოსტა ჯერ არ არის დადასტურებული. გთხოვთ შეამოწმოთ საფოსტო ყუთი.';
  }

  if (normalized.includes('too many requests') || normalized.includes('rate limit')) {
    return 'ძალიან ბევრი მცდელობაა. გთხოვთ ცოტა ხანში სცადოთ თავიდან.';
  }

  if (normalized.includes('user already registered') || normalized.includes('already registered')) {
    return 'ამ ელფოსტით მომხმარებელი უკვე რეგისტრირებულია.';
  }

  if (normalized.includes('password should be') || normalized.includes('weak password')) {
    return 'პაროლი ძალიან სუსტია. გთხოვთ გამოიყენოთ მინიმუმ 6 სიმბოლო.';
  }

  if (normalized.includes('invalid email')) {
    return 'ელფოსტის ფორმატი არასწორია.';
  }

  if (normalized.includes('signup is disabled')) {
    return 'რეგისტრაცია დროებით გამორთულია.';
  }

  if (normalized.includes('invalid refresh token') || normalized.includes('refresh_token_not_found')) {
    return 'სესია ვადაგასულია. გთხოვთ თავიდან შეხვიდეთ.';
  }

  if (normalized.includes('otp') || normalized.includes('token') || normalized.includes('expired')) {
    return 'ბმული არასწორია ან ვადა ამოიწურა. გთხოვთ თავიდან სცადოთ.';
  }

  return message || 'უცნობი შეცდომა. გთხოვთ სცადოთ თავიდან.';
}

function getRawErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return '';
  }
}
