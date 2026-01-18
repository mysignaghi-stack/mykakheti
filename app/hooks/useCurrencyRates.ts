import { useEffect, useState } from 'react';

export interface CurrencyRate {
  code: string;
  rate: number;
}

type NbgCurrency = {
  code: string;
  rate: string;
};

type NbgResponseItem = {
  currencies?: NbgCurrency[];
};

export function useCurrencyRates() {
  const [rates, setRates] = useState<CurrencyRate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRates() {
      setLoading(true);
      setError(null);
      try {
        // Example: NBG API for GEL rates
        const res = await fetch('https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/ka/json', {
          signal: controller.signal,
        });
        const data = (await res.json()) as NbgResponseItem[];
        // Find USD, EUR, RUB
        const today = data[0]?.currencies ?? [];
        const filtered = today.filter((c) => ['USD', 'EUR', 'RUB'].includes(c.code));
        setRates(filtered.map((c) => ({ code: c.code, rate: parseFloat(c.rate) })));
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setError('ვალუტის კურსის მიღება ვერ მოხერხდა');
      }
      setLoading(false);
    }
    fetchRates();

    return () => {
      controller.abort();
    };
  }, []);

  return { rates, loading, error };
}
