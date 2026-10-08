import { Card, CardContent, Typography, Box } from '@mui/material';
import type { Aggregates } from '../types/currency';

interface Props {
    data: Aggregates;
}

export default function AggregatesCard({ data }: Props) {
    return (
        <Card sx={{ mt: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Агрегированные значения курса
                </Typography>
                <Box sx={{ display: 'flex', gap: 4 }}>
                    <Typography><strong>Средний:</strong> {data.average.toFixed(4)}</Typography>
                    <Typography><strong>Максимум:</strong> {data.max.toFixed(4)}</Typography>
                    <Typography><strong>Минимум:</strong> {data.min.toFixed(4)}</Typography>
                </Box>
            </CardContent>
        </Card>
    );
}