import { apiClient } from './client';
import type {
    Currency,
    RatesResponse,
    Aggregates,
    ConversionResponse,
} from '../types/currency';

export async function getCurrencies(): Promise<Currency[]> {
    const { data } = await apiClient.get<Currency[]>('/currencies');
    return data;
}

export async function getRates(
    code: string,
    year: number,
    month: number
): Promise<RatesResponse> {
    const { data } = await apiClient.get<RatesResponse>('/rates', {
        params: { code, year, month },
    });
    return data;
}

export async function getAggregates(
    code: string,
    year: number,
    month: number
): Promise<Aggregates> {
    const { data } = await apiClient.get<Aggregates>('/rates/aggregates', {
        params: { code, year, month },
    });
    return data;
}

export async function convert(
    from: string,
    to: string,
    amount: number
): Promise<ConversionResponse> {
    const { data } = await apiClient.get<ConversionResponse>('/convert', {
        params: { from, to, amount },
    });
    return data;
}