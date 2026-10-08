import { Alert, Box, CircularProgress, Button } from '@mui/material';
import { useRates } from '../../hooks/useRates';
import RatesTable from '../RatesTable';

interface Props {
    code: string;
    year: number;
    month: number;
}

export default function RatesSection({ code, year, month }: Props) {
    const query = useRates(code, year, month);

    if (query.data) {
        return <RatesTable data={query.data} />;
    }

    if (query.isError) {
        return (
            <Alert
                severity="error"
                sx={{ mb: 2 }}
                action={
                    <Button
                        color="inherit"
                        size="small"
                        onClick={() => query.refetch()}
                    >
                        Повторить
                    </Button>
                }
            >
                Не удалось загрузить курсы валют
            </Alert>
        );
    }

    if (query.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    return null;
}