import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert,
} from '@mui/material';
import type { RatesResponse } from '../types/currency';
import RateChangeCell from './RateChangeCell';

interface Props {
    data: RatesResponse | undefined;
}

export default function RatesTable({ data }: Props) {
    if (!data) return <CircularProgress />;
    if (!data.rates.length) return <Alert severity="info">Нет данных</Alert>;

    return (
        <TableContainer component={Paper}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell><strong>Дата</strong></TableCell>
                        <TableCell align="right"><strong>Курс (BYN)</strong></TableCell>
                        <TableCell align="right"><strong>Изменение (BYN)</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.rates.map(r => (
                        <TableRow key={r.date}>
                            <TableCell>{new Date(r.date).toLocaleDateString('ru-RU')}</TableCell>
                            <TableCell align="right">{r.rate.toFixed(4)}</TableCell>
                            <TableCell align="right"><RateChangeCell change={r.change} /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}