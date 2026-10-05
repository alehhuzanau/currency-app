import { useEffect, useState } from 'react';
import { getCurrencies } from './api/currencyApi';
import type { Currency } from './types/currency';

export default function App() {
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCurrencies()
            .then(data => {
                setCurrencies(data);
                setError(null);
            })
            .catch(err => {
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) return <p style={{ padding: 20 }}>Загрузка...</p>;
    if (error) return <p style={{ padding: 20, color: 'red' }}>Ошибка: {error}</p>;

    return (
        <div style={{ padding: 20 }}>
            <h1>Валюты ({currencies.length})</h1>
            <ul>
                {currencies.map(c => (
                    <li key={c.code}>
                        <strong>{c.code}</strong> — {c.name} (scale: {c.scale})
                    </li>
                ))}
            </ul>
        </div>
    );
}