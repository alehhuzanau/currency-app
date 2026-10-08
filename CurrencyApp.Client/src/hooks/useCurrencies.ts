import { useQuery } from '@tanstack/react-query';
import { getCurrencies } from '../api/currencyApi';

export function useCurrencies() {
    return useQuery({
        queryKey: ['currencies'],
        queryFn: getCurrencies,
    });
}