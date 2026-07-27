export type BackgroundColor = [normal: string, hover: string, primary: string]

export const backgroundColorGroup: BackgroundColor[] = [
    ['#4A90E2', '#357ABD', '#2A5F9E'],
    ['#50C1E9', '#35A8D0', '#2A87A8'],
    ['#7ED321', '#66B116', '#4F8A10'],
    ['#F5A623', '#D98E1B', '#B07314'],
    ['#D0021B', '#B00217', '#8A0111'],
    ['#9013FE', '#770DD6', '#5E0AA8'],
    ['#BD10E0', '#9A0DB8', '#780A8F'],
    ['#8B572A', '#704321', '#553319'],
    ['#417505', '#345E04', '#264503'],
    ['#B8E986', '#9FD36E', '#82B055'],
]

export const textStyleGroup = {
    dark: {
        color: '#ffffff',
        shadow: {
            offsetX: 1,
            offsetY: 1,
            blur: 2,
            color: 'rgba(0, 0, 0, 0.5)',
        },
    },
    light: {
        color: '#333333',
        shadow: {
            offsetX: 0,
            offsetY: 0,
            blur: 0,
            color: 'transparent',
        },
    },
} as const
