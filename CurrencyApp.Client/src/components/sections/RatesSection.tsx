import { Alert, Button, Box } from '@mui/material';
import type { UseQueryResult } from '@tanstack/react-query';
import type { RatesResponse } from '../../types/currency';
import RatesTable from '../RatesTable';
import ShimmerOverlay from '../ShimmerOverlay';
import { useDelayedFlag } from '../../hooks/useDelayedFlag';

interface Props {
    query: UseQueryResult<RatesResponse, Error>;
}

export default function RatesSection({ query }: Props) {
    const showShimmer = useDelayedFlag(query.isFetching && !!query.data);

    if (query.isError) {
        return (
            <Alert
                severity="error"
                sx={{ mb: 2 }}
                action={
                    <Button color="inherit" size="small" onClick={() => query.refetch()}>
                        Повторить
                    </Button>
                }
            >
                Не удалось загрузить курсы валют
            </Alert>
        );
    }

    if (!query.data) {
        return (
            <Box>
                <Box sx={{ height: 40, bgcolor: 'action.hover', borderRadius: 1, mb: 0.5 }} />
                {Array.from({ length: 6 }).map((_, i) => (
                    <Box
                        key={i}
                        sx={{ height: 32, bgcolor: 'action.hover', borderRadius: 1, mb: 0.5 }}
                    />
                ))}
            </Box>
        );
    }

    return (
        <Box sx={{ position: 'relative' }}>
            <RatesTable data={query.data} />
            <ShimmerOverlay show={showShimmer} />
        </Box>
    );
}