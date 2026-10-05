import { Typography } from '@mui/material';

export default function RateChangeCell({ change }: { change: number | null }) {
    if (change == null) return <Typography color="text.secondary">—</Typography>;
    if (change === 0) return <Typography color="text.secondary">0.0000</Typography>;

    return (
        <Typography sx={{ color: change > 0 ? 'success.main' : 'error.main' }}>
            {change > 0 ? '+' : ''}{change.toFixed(4)}
        </Typography>
    );
}
