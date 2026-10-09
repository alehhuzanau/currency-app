import { useState, useEffect } from 'react';

/**
 * Возвращает true, если условие остаётся истинным дольше delay.
 * Для предотвращения мелькания спиннеров/скелетонов.
 */
export function useDelayedFlag(active: boolean, delay: number = 150): boolean {
    const [flag, setFlag] = useState(false);

    useEffect(() => {
        if (!active) {
            setFlag(false);
            return;
        }
        const timer = setTimeout(() => setFlag(true), delay);
        return () => clearTimeout(timer);
    }, [active, delay]);

    return flag;
}