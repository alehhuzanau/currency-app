import { Box } from '@mui/material';

interface Props {
    show: boolean;
}

export default function ShimmerOverlay({ show }: Props) {
    if (!show) return null;

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 2,
                pointerEvents: 'none',
                overflow: 'hidden',
                borderRadius: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                        'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
                    animation: 'shimmer 1.5s infinite',
                },
                '@keyframes shimmer': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
            }}
        />
    );
}