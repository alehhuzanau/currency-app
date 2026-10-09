import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    IconButton,
    Alert,
} from '@mui/material';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { useQuery } from '@tanstack/react-query';
import { convert } from '../api/currencyApi';
import type { Currency } from '../types/currency';
import ShimmerOverlay from './ShimmerOverlay';
import { useDelayedFlag } from '../hooks/useDelayedFlag';

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

        if (!value) setAmountError('Введите сумму');
        else if (isNaN(num)) setAmountError('Некорректное число');
        else if (num <= 0) setAmountError('Сумма должна быть положительной');
        else setAmountError(null);
    };

    const [debouncedAmount, setDebouncedAmount] = useState(amount);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedAmount(amount), 400);
        return () => clearTimeout(timer);
    }, [amount]);

    const { data, isFetching, isError } = useQuery({
        queryKey: ['convert', from, to, debouncedAmount],
        queryFn: () => convert(from, to, debouncedAmount),
        enabled: !amountError && debouncedAmount > 0 && !!from && !!to,
        placeholderData: (previousData) => previousData,
    });

    const showShimmer = useDelayedFlag(isFetching && !!data);

    const handleSwap = () => {
        setFrom(to);
        setTo(from);
    };

    const parseMessage = (message: string) => {
        const [prefix, rest] = message.split(': ');
        if (!rest) return { prefix: message, rates: [] };

        const rates = rest
            .split(';')
            .map(s => s.trim().replace(/\.$/, ''))
            .filter(Boolean);

        return { prefix: prefix + ':', rates };
    };

    return (
        <Card sx={{ maxWidth: 400, mx: 'auto' }}>
            <CardContent>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Box
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                        }}
                    >
                        <FormControl size="small" fullWidth>
                            <InputLabel>Из</InputLabel>
                            <Select
                                value={from}
                                label="Из"
                                onChange={e => setFrom(e.target.value)}
                                sx={{
                                    '& .MuiSelect-select': {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    },
                                }}
                            >
                                {allCurrencies.map(c => (
                                    <MenuItem key={c.code} value={c.code}>
                                        {c.name} ({c.code})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" fullWidth>
                            <InputLabel>В</InputLabel>
                            <Select
                                value={to}
                                label="В"
                                onChange={e => setTo(e.target.value)}
                                sx={{
                                    '& .MuiSelect-select': {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    },
                                }}
                            >
                                {allCurrencies.map(c => (
                                    <MenuItem key={c.code} value={c.code}>
                                        {c.name} ({c.code})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <IconButton onClick={handleSwap} color="primary">
                        <SwapVertIcon />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <TextField
                            label="Сумма"
                            type="number"
                            size="small"
                            fullWidth
                            value={amount}
                            onChange={e => handleAmountChange(e.target.value)}
                            slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
                            error={!!amountError}
                            helperText={amountError}
                        />
                    </Box>
                    <Box sx={{ width: 40 }} />
                </Box>

                <Box sx={{ mt: 2, position: 'relative' }}>
                    {isError && <Alert severity="error">Ошибка конвертации</Alert>}

                    {data && !amountError && (() => {
                        const { prefix, rates } = parseMessage(data.message);
                        return (
                            <>
                                <Typography variant="h6">
                                    {data.amount} {data.from} ={' '}
                                    <strong>{data.result} {data.to}</strong>
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {prefix}
                                        {rates.map((rate, i) => (
                                            <span key={i}>
                                                <br />
                                                {rate}
                                            </span>
                                        ))}
                                    </Typography>
                                </Box>
                            </>
                        );
                    })()}

                    <ShimmerOverlay show={showShimmer} />
                </Box>
            </CardContent>
        </Card>
    );
}