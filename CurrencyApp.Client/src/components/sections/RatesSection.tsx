import { Alert, Button, Box } from '@mui/material';
import type { UseQueryResult } from '@tanstack/react-query';
import type { RatesResponse } from '../../types/currency';
import RatesTable from '../RatesTable';
import ShimmerOverlay from '../ShimmerOverlay';
import { useDelayedFlag } from '../../hooks/useDelayedFlag';
import DownloadIcon from '@mui/icons-material/Download';
import { exportToCsv } from '../../utils/exportToCsv';

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
            {query.data && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                    <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => {
                            const rows = query.data.rates.map(r => ({
                                'Дата': new Date(r.date).toLocaleDateString('ru-RU'),
                                'Курс (BYN)': r.rate.toFixed(4),
                                'Изменение (BYN)': r.change === null ? '' : r.change.toFixed(4),
                            }));
                            exportToCsv(
                                rows,
                                `${query.data.code}_${query.data.year}_${query.data.month}`
                            );
                        }}
                    >
                        Экспорт в CSV
                    </Button>
                </Box>
            )}

            <RatesTable data={query.data} />
            <ShimmerOverlay show={showShimmer} />
        </Box>
    );
}