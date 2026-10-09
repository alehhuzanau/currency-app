import { Box, Typography } from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import type { Rate } from '../types/currency';

interface Props {
    rates: Rate[];
}

export default function RatesChart({ rates }: Props) {
    if (!rates.length) return null;

    const data = rates.map(r => ({
        date: new Date(r.date).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
        }),
        rate: r.rate,
    }));

    const values = data.map(d => d.rate);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 0.01;

    return (
        <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Динамика курса за месяц
            </Typography>

            <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={[min - padding, max + padding]}
                            tick={{ fontSize: 12 }}
                            tickFormatter={v => v.toFixed(4)}
                            width={70}
                        />
                        <Tooltip
                            formatter={(value) => [
                                typeof value === 'number' ? value.toFixed(4) : String(value),
                                'Курс (BYN)',
                            ]}
                            labelFormatter={(label) => `Дата: ${label}`}
                        />
                        <Line
                            type="monotone"
                            dataKey="rate"
                            stroke="#1976d2"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
}