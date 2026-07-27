export const canvasColor = '#f0f4f8'

export const edgeColor = {
    light: '#1770E5',
    dark: 'rgba(0,0,0,0.4)',
}

export interface TextStyle {
    color: string
    shadow: TextShadow
}

export interface TextShadow {
    offsetX: number
    offsetY: number
    blur: number
    color: string
}

export interface TextStyleGroup {
    light: TextStyle
    dark: TextStyle
}

export const textStyleGroup: TextStyleGroup = {
    light: {
        color: '#e2e8f0',
        shadow: {
            offsetX: 0,
            offsetY: 1,
            blur: 2,
            color: 'rgba(45, 55, 72, 0.5)',
        },
    },
    dark: {
        color: '#2d3748',
        shadow: {
            offsetX: 0,
            offsetY: 1,
            blur: 2,
            color: 'rgba(226, 232, 240, 0.5)',
        },
    },
}

export type BackgroundColor = [string, string, string]

export const backgroundColorGroup: BackgroundColor[] = [
    ['#7FD6FF', '#4CB4E0', '#2583B0'],
    ['#B18CFF', '#8A6AE0', '#6349C9'],
    ['#4DE2CA', '#2FC2AD', '#1D8F7F'],
    ['#FF9AD6', '#E06FB8', '#B04A8F'],
    ['#FFC285', '#E0A46A', '#B07D45'],
    ['#FF8A8A', '#E06F6F', '#B04A4A'],
    ['#D0E6FF', '#A5C0E0', '#7F8AB0'],
    ['#FFE285', '#E0C46A', '#B09A45'],
]
