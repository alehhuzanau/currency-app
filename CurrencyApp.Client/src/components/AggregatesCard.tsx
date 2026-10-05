import { Card, CardContent, Typography, Box, CircularProgress, Alert } from '@mui/material';
import type { Aggregates } from '../types/currency';

interface Props {
    data: Aggregates | undefined;
    isLoading: boolean;
    isError: boolean;
}

export default function AggregatesCard({ data, isLoading, isError }: Props) {
    if (isLoading) {
        return (
            <Card sx={{ mt: 2 }}>
                <CardContent>
                    <CircularProgress size={20} />
                </CardContent>
            </Card>
        );
    }

    if (isError || !data) {
        return (
            <Card sx={{ mt: 2 }}>
                <CardContent>
                    <Alert severity="info">Агрегаты недоступны</Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ mt: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Агрегированные значения курса
                </Typography>
                <Box sx={{ display: 'flex', gap: 4 }}>
                    <Typography>
                        <strong>Средний:</strong> {data.average.toFixed(4)}
                    </Typography>
                    <Typography>
                        <strong>Максимум:</strong> {data.max.toFixed(4)}
                    </Typography>
                    <Typography>
                        <strong>Минимум:</strong> {data.min.toFixed(4)}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}