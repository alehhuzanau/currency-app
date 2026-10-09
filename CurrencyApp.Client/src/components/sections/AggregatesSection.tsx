import { Alert, Button, Box, Card, CardContent } from '@mui/material';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Aggregates } from '../../types/currency';
import AggregatesCard from '../AggregatesCard';
import ShimmerOverlay from '../ShimmerOverlay';
import { useDelayedFlag } from '../../hooks/useDelayedFlag';

interface Props {
    query: UseQueryResult<Aggregates, Error>;
}

export default function AggregatesSection({ query }: Props) {
    const showShimmer = useDelayedFlag(query.isFetching && !!query.data);

    if (query.isError) {
        return (
            <Alert
                severity="error"
                sx={{ mt: 2, mb: 2 }}
                action={
                    <Button color="inherit" size="small" onClick={() => query.refetch()}>
                        Повторить
                    </Button>
                }
            >
                Не удалось загрузить агрегаты
            </Alert>
        );
    }

    if (!query.data) {
        return (
            <Card sx={{ mt: 2 }}>
                <CardContent>
                    <Box sx={{ height: 40, bgcolor: 'action.hover', borderRadius: 1 }} />
                    <Box sx={{ height: 40, bgcolor: 'action.hover', borderRadius: 1, mt: 1 }} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Box sx={{ position: 'relative', mt: 2 }}>
            <AggregatesCard data={query.data} />
            <ShimmerOverlay show={showShimmer} />
        </Box>
    );
}