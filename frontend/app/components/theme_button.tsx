"use client";
import React, { useState, useContext } from "react";
import { ToggleButton } from "primereact/togglebutton";
import { PrimeReactContext } from "primereact/api";

//Use in a component

interface ToggleThemeProps {
    className?: string;
}

export default function Toggle_theme(props: ToggleThemeProps) {
    const [theme, setTheme] = useState("dark");
    const { changeTheme } = useContext(PrimeReactContext);
    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        const newThemePath =
            theme === "dark" ? "/viva-light/theme.css" : "/viva-dark/theme.css";
        const themeLink = document.getElementById(
            "theme-link",
        ) as HTMLLinkElement;
        const currentThemePath = themeLink.getAttribute("href");

        if (currentThemePath && changeTheme) {
            changeTheme(currentThemePath, newThemePath, "theme-link", () => {
                setTheme(newTheme);
            });
        }
    };
    return (
        <ToggleButton
            checked={theme === "dark"}
            onIcon="pi pi-sun"
            offIcon="pi pi-moon"
            onLabel=""
            offLabel=""
            onChange={toggleTheme}
            className={`${props.className} `}
        />
    );
}
