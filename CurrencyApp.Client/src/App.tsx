import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Typography, Alert } from '@mui/material';
import { getCurrencies, getRates, getAggregates } from './api/currencyApi';
import RatesFilters from './components/RatesFilters';
import RatesTable from './components/RatesTable';
import AggregatesCard from './components/AggregatesCard';

export default function App() {
    const now = new Date();
    const [selectedCode, setSelectedCode] = useState('');
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

    const currenciesQuery = useQuery({
        queryKey: ['currencies'],
        queryFn: getCurrencies,
    });

    useEffect(() => {
        if (currenciesQuery.data?.length && !selectedCode) {
            const sorted = [...currenciesQuery.data].sort((a, b) =>
                a.name.localeCompare(b.name, 'ru')
            );
            setSelectedCode(sorted[0].code);
        }
    }, [currenciesQuery.data, selectedCode]);

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
                onCodeChange={setSelectedCode}
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
        </Container>
    );
}
