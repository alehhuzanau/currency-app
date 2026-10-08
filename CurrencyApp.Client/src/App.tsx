import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Container,
    Typography,
    Alert,
    Box,
    CircularProgress,
    Button,
} from '@mui/material';
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

    const criticalError = currenciesQuery.isError && !currenciesQuery.data;

    if (criticalError) {
        return (
            <Container maxWidth="md" sx={{ mt: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Курсы валют НБРБ
                </Typography>
                <Alert
                    severity="error"
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => currenciesQuery.refetch()}
                        >
                            Повторить
                        </Button>
                    }
                >
                    Не удалось загрузить список валют. Проверьте подключение к интернету.
                </Alert>
            </Container>
        );
    }

    const isInitialLoading =
        currenciesQuery.isLoading ||
        (ratesQuery.isLoading && !ratesQuery.data) ||
        (aggregatesQuery.isLoading && !aggregatesQuery.data);

    const nothingLoadedYet = !ratesQuery.data && !aggregatesQuery.data;

    return (
        <Container maxWidth="md" sx={{ mt: 3 }}>
            <Typography variant="h5" gutterBottom>
                Курсы валют НБРБ
            </Typography>

            {currenciesQuery.data && (
                <RatesFilters
                    currencies={currenciesQuery.data}
                    selectedCode={selectedCode}
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                    onCodeChange={setUserSelectedCode}
                    onYearChange={setSelectedYear}
                    onMonthChange={setSelectedMonth}
                />
            )}

            {isInitialLoading && nothingLoadedYet ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <CircularProgress size={48} />
                </Box>
            ) : (
                <>
                    {ratesQuery.data && <RatesTable data={ratesQuery.data} />}
                    {ratesQuery.isError && (
                        <Alert
                            severity="error"
                            sx={{ mb: 2 }}
                            action={
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={() => ratesQuery.refetch()}
                                >
                                    Повторить
                                </Button>
                            }
                        >
                            Не удалось загрузить курсы валют
                        </Alert>
                    )}
                    {!ratesQuery.data && !ratesQuery.isError && ratesQuery.isLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <CircularProgress size={32} />
                        </Box>
                    )}

                    {aggregatesQuery.data && <AggregatesCard data={aggregatesQuery.data} />}
                    {aggregatesQuery.isError && (
                        <Alert
                            severity="error"
                            sx={{ mb: 2 }}
                            action={
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={() => aggregatesQuery.refetch()}
                                >
                                    Повторить
                                </Button>
                            }
                        >
                            Не удалось загрузить агрегаты
                        </Alert>
                    )}
                    {!aggregatesQuery.data && !aggregatesQuery.isError && aggregatesQuery.isLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <CircularProgress size={32} />
                        </Box>
                    )}
                </>
            )}

            {currenciesQuery.data && (
                <ConverterCard currencies={currenciesQuery.data} />
            )}
        </Container>
    );
}