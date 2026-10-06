import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Typography, Alert } from '@mui/material';
import { getCurrencies, getRates, getAggregates } from './api/currencyApi';
import RatesFilters from './components/RatesFilters';
import RatesTable from './components/RatesTable';
import AggregatesCard from './components/AggregatesCard';
import ConverterCard from './components/ConverterCard';

export default function App() {
    const now = new Date();
    const [userSelectedCode, setUserSelectedCode] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

    const currenciesQuery = useQuery({
        queryKey: ['currencies'],
        queryFn: getCurrencies,
    });

    const selectedCode = userSelectedCode
        ?? currenciesQuery.data?.find(c => c.code === 'USD')?.code
        ?? currenciesQuery.data?.[0]?.code
        ?? '';

    const ratesQuery = useQuery({
        queryKey: ['rates', selectedCode, selectedYear, selectedMonth],
        queryFn: () => getRates(selectedCode, selectedYear, selectedMonth),
        enabled: !!selectedCode,
    });

    const aggregatesQuery = useQuery({
        queryKey: ['aggregates', selectedCode, selectedYear, selectedMonth],
        queryFn: () => getAggregates(selectedCode, selectedYear, selectedMonth),
        enabled: !!selectedCode,
    });

    if (currenciesQuery.isError) {
        return <Alert severity="error">Не удалось загрузить валюты</Alert>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 3 }}>
            <Typography variant="h5" gutterBottom>Курсы валют НБРБ</Typography>

            <RatesFilters
                currencies={currenciesQuery.data ?? []}
                selectedCode={selectedCode}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                onCodeChange={setUserSelectedCode}
                onYearChange={setSelectedYear}
                onMonthChange={setSelectedMonth}
            />

            <RatesTable
                data={ratesQuery.data}
                isLoading={ratesQuery.isLoading}
                isError={ratesQuery.isError}
            />

            <AggregatesCard
                data={aggregatesQuery.data}
                isLoading={aggregatesQuery.isLoading}
                isError={aggregatesQuery.isError}
            />

            <ConverterCard currencies={currenciesQuery.data ?? []} />
        </Container>
    );
}
