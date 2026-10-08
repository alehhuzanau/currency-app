import { Alert, Box, CircularProgress, Button } from '@mui/material';
import { useAggregates } from '../../hooks/useAggregates';
import AggregatesCard from '../AggregatesCard';

interface Props {
    code: string;
    year: number;
    month: number;
}

export default function AggregatesSection({ code, year, month }: Props) {
    const query = useAggregates(code, year, month);

    if (query.data) {
        return <AggregatesCard data={query.data} />;
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
                Не удалось загрузить агрегаты
            </Alert>
        );
    }

    if (query.isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    return null;
}