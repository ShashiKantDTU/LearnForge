import { createContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const ThemeProvider = ({children}) =>{
    const [theme,setTheme] = useState('light');

    useEffect(()=>{
        const savedTheme = localStorage.getItem('theme') || 'light';
        if(savedTheme){
            setTheme(savedTheme);
        }
    },[])

    useEffect(()=>{
        document.documentElement.setAttribute('data-theme',theme);
        localStorage.setItem('theme',theme);
    },[theme])

    const toggleTheme = () =>{
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
        
    }

    return (
        <ThemeContext.Provider value={{theme,toggleTheme}}>
            {children}
        </ThemeContext.Provider>
    )
}

export {ThemeContext,ThemeProvider};
