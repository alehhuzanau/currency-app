export interface Currency {
    id: number;
    code: string;
    name: string;
    scale: number;
}

export interface Rate {
    date: string;
    rate: number;
    change: number | null;
    scale: number;
    code: string;
    name: string;
}

export interface RatesResponse {
    code: string;
    name: string;
    year: number;
    month: number;
    rates: Rate[];
}

export interface Aggregates {
    code: string;
    name: string;
    year: number;
    month: number;
    average: number;
    max: number;
    min: number;
}

export interface ConversionRate {
    code: string;
    name: string;
    rate: number;
    date: string;
    scale: number;
}

export interface ConversionResponse {
    from: string;
    to: string;
    amount: number;
    result: number;
    conversionRates: ConversionRate[];
    calculatedAt: string;
    message: string;
}