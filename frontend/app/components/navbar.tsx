"use client";
import React from "react";
import { Toolbar } from "primereact/toolbar";
import { Avatar } from "primereact/avatar";
import Toggle_theme from "./theme_button";
// import styles from "./toggle.module.css";

export default function Header() {
    const start = <h1 className="font-bold text-xl">Reddit Viewer</h1>;
    const end = (
        <span className="flex items-center justify-between gap-2">
            <Toggle_theme className="rounded-full h-10 w-10" />

            <Avatar icon="pi pi-github" shape="circle" className="h-10 w-10" />
        </span>
    );

    return <Toolbar className="rounded-none" start={start} end={end} />;
}
