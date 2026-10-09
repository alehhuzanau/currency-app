import { useQuery } from '@tanstack/react-query';
import { getRates } from '../api/currencyApi';

export function useRates(code: string, year: number, month: number) {
    return useQuery({
        queryKey: ['rates', code, year, month],
        queryFn: () => getRates(code, year, month),
        enabled: !!code,
        placeholderData: (previousData) => previousData,
    });
}