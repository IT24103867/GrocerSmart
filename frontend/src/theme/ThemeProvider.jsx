import { createContext, useState, useMemo, useEffect, useContext } from 'react';

export const ColorModeContext = createContext({ toggleColorMode: () => { } });
export const useColorMode = () => useContext(ColorModeContext);

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        const root = window.document.documentElement;
        if (mode === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
        }
    }, [mode]);

    const colorMode = useMemo(
        () => ({
            mode,
            toggleColorMode: () => {
                setMode((prevMode) => {
                    const newMode = prevMode === 'light' ? 'dark' : 'light';
                    localStorage.setItem('theme', newMode);
                    return newMode;
                });
            },
        }),
        [mode],
    );

    return (
        <ColorModeContext.Provider value={colorMode}>
            {children}
        </ColorModeContext.Provider>
    );
};
