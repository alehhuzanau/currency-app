import { useState, useEffect } from 'react';
import {
    Card, CardContent, Typography, TextField,
    FormControl, InputLabel, Select, MenuItem,
    Box, IconButton, Alert, CircularProgress,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useQuery } from '@tanstack/react-query';
import { convert } from '../api/currencyApi';
import type { Currency } from '../types/currency';

const BYN: Currency = { id: 0, code: 'BYN', name: 'Белорусский рубль', scale: 1 };

interface Props {
    currencies: Currency[];
}

export default function ConverterCard({ currencies }: Props) {
    const [from, setFrom] = useState('BYN');
    const [to, setTo] = useState('');
    const [amount, setAmount] = useState<number>(100);
    const [amountError, setAmountError] = useState<string | null>(null);

    const allCurrencies = [BYN, ...currencies].sort((a, b) =>
        a.name.localeCompare(b.name, 'ru')
    );

    useEffect(() => {
        if (currencies.length && !to) {
            const usd = currencies.find(c => c.code === 'USD');
            setTo(usd?.code ?? currencies[0].code);
        }
    }, [currencies, to]);

    const handleAmountChange = (value: string) => {
        const num = Number(value);
        setAmount(num);

        if (!value) {
            setAmountError('Введите сумму');
        } else if (isNaN(num)) {
            setAmountError('Некорректное число');
        } else if (num <= 0) {
            setAmountError('Сумма должна быть положительной');
        } else {
            setAmountError(null);
        }
    };

    const [debouncedAmount, setDebouncedAmount] = useState(amount);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedAmount(amount), 400);
        return () => clearTimeout(timer);
    }, [amount]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['convert', from, to, debouncedAmount],
        queryFn: () => convert(from, to, debouncedAmount),
        enabled: !amountError && debouncedAmount > 0 && !!from && !!to,
    });

    const handleSwap = () => {
        setFrom(to);
        setTo(from);
    };

    return (
        <Card sx={{ mt: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>Калькулятор валют</Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Из</InputLabel>
                        <Select value={from} label="Из" onChange={e => setFrom(e.target.value)}>
                            {allCurrencies.map(c => (
                                <MenuItem key={c.code} value={c.code}>
                                    {c.name} ({c.code})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <IconButton onClick={handleSwap} sx={{ mt: 0.5 }}>
                        <SwapHorizIcon />
                    </IconButton>

                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>В</InputLabel>
                        <Select value={to} label="В" onChange={e => setTo(e.target.value)}>
                            {allCurrencies.map(c => (
                                <MenuItem key={c.code} value={c.code}>
                                    {c.name} ({c.code})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Сумма"
                        type="number"
                        size="small"
                        value={amount}
                        onChange={e => handleAmountChange(e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: 1 } }}
                        error={!!amountError}
                        helperText={amountError}
                        sx={{ width: 180 }}
                    />
                </Box>

                <Box sx={{ mt: 2 }}>
                    {isLoading && <CircularProgress size={20} />}
                    {isError && <Alert severity="error">Ошибка конвертации</Alert>}
                    {data && !amountError && (
                        <>
                            <Typography variant="h6">
                                {data.amount} {data.from} = <strong>{data.result} {data.to}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {data.message}
                            </Typography>
                        </>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}