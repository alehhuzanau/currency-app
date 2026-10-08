import { useState } from 'react';
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
import RatesFilters from './components/RatesFilters';
import RatesSection from './components/sections/RatesSection';
import AggregatesSection from './components/sections/AggregatesSection';
import ConverterCard from './components/ConverterCard';

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
                    <Grid size={{ xs: 12, md: 8 }}>
                        <RatesSection
                            code={selectedCode}
                            year={selectedYear}
                            month={selectedMonth}
                        />
                        <AggregatesSection
                            code={selectedCode}
                            year={selectedYear}
                            month={selectedMonth}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <ConverterCard currencies={currenciesQuery.data} />
                    </Grid>
                </Grid>
            )}
        </Container>
    );
}