import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import type { Currency } from '../types/currency';

const MONTHS = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const MIN_YEAR = 2020;
const MAX_YEAR = new Date().getFullYear();;

interface Props {
    currencies: Currency[];
    selectedCode: string;
    selectedYear: number;
    selectedMonth: number;
    onCodeChange: (code: string) => void;
    onYearChange: (year: number) => void;
    onMonthChange: (month: number) => void;
}

export default function RatesFilters({
    currencies,
    selectedCode,
    selectedYear,
    selectedMonth,
    onCodeChange,
    onYearChange,
    onMonthChange,
}: Props) {
    const sortedCurrencies = [...currencies].sort((a, b) =>
        a.name.localeCompare(b.name, 'ru')
    );

    const years: number[] = [];
    for (let y = MAX_YEAR; y >= MIN_YEAR; y--) {
        years.push(y);
    }

    return (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 250 }}>
                <InputLabel>Валюта</InputLabel>
                <Select
                    value={selectedCode}
                    label="Валюта"
                    onChange={e => onCodeChange(e.target.value)}
                >
                    {sortedCurrencies.map(c => (
                        <MenuItem key={c.code} value={c.code}>
                            {c.name} ({c.code})
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Год</InputLabel>
                <Select
                    value={selectedYear}
                    label="Год"
                    onChange={e => onYearChange(Number(e.target.value))}
                >
                    {years.map(y => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Месяц</InputLabel>
                <Select
                    value={selectedMonth}
                    label="Месяц"
                    onChange={e => onMonthChange(Number(e.target.value))}
                >
                    {MONTHS.map((name, i) => (
                        <MenuItem key={i + 1} value={i + 1}>{name}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}
