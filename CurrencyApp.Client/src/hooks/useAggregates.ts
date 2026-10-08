import { useQuery } from '@tanstack/react-query';
import { getAggregates } from '../api/currencyApi';

export function useAggregates(code: string, year: number, month: number) {
    return useQuery({
        queryKey: ['aggregates', code, year, month],
        queryFn: () => getAggregates(code, year, month),
        enabled: !!code,
    });
}