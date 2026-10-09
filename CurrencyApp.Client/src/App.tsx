import { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Alert,
    Box,
    CircularProgress,
    Button,
    Grid,
} from '@mui/material';
import { useCurrencies } from './hooks/useCurrencies';
import { useRates } from './hooks/useRates';
import { useAggregates } from './hooks/useAggregates';
import RatesFilters from './components/RatesFilters';
import RatesSection from './components/sections/RatesSection';
import AggregatesSection from './components/sections/AggregatesSection';
import ConverterCard from './components/ConverterCard';
import RatesChart from './components/RatesChart';

export default function App() {
    const now = new Date();
    const [userSelectedCode, setUserSelectedCode] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

    const currenciesQuery = useCurrencies();
    const selectedCode = userSelectedCode
        ?? currenciesQuery.data?.find(c => c.code === 'USD')?.code
        ?? currenciesQuery.data?.[0]?.code
        ?? '';

    const ratesQuery = useRates(selectedCode, selectedYear, selectedMonth);
    const aggregatesQuery = useAggregates(selectedCode, selectedYear, selectedMonth);

    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    useEffect(() => {
        if (ratesQuery.data && aggregatesQuery.data) {
            setHasLoadedOnce(true);
        }
    }, [ratesQuery.data, aggregatesQuery.data]);

    const criticalError = currenciesQuery.isError && !currenciesQuery.data;
    if (criticalError) {
        return (
            <Container maxWidth="lg" sx={{ mt: 3 }}>
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

    const firstLoad =
        !hasLoadedOnce &&
        (ratesQuery.isPending || aggregatesQuery.isPending);

    return (
        <Container maxWidth="lg" sx={{ mt: 3 }}>
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

            {currenciesQuery.isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <CircularProgress size={48} />
                </Box>
            )}

            {currenciesQuery.data && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }} sx={{ pb: { xs: 0, md: 4 } }}>
                        <RatesSection query={ratesQuery} />
                        <AggregatesSection query={aggregatesQuery} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }} sx={{ pb: { xs: 4, md: 0 } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography variant="h6">
                                    Калькулятор валют
                                </Typography>
                                <ConverterCard currencies={currenciesQuery.data} />
                            </Box>

                            {ratesQuery.data && (
                                <RatesChart rates={ratesQuery.data.rates} />
                            )}
                        </Box>
                    </Grid>
                </Grid>
            )}
        </Container>
    );
}