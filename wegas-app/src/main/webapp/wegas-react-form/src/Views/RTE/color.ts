const COLORS = {
    BLUE: 'blue',
    RED: 'red',
    BLACK: 'black',
};

export const BACKGROUND_COLORS = Object.keys(COLORS).reduce(
    (p, c) => ({ ...p, [c + '_BG']: { backgroundColor: COLORS[c] } }),
    {}
);
export const FOREGROUND_COLORS = Object.keys(COLORS).reduce(
    (p, c) => ({ ...p, [c]: { color: COLORS[c] } }),
    {}
);
