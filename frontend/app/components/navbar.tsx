"use client";
import React from "react";
import { Toolbar } from "primereact/toolbar";
import { Avatar } from "primereact/avatar";
import Toggle_theme from "./theme_button";
import { useRouter } from "next/navigation";

export default function Header() {
    const start = <h1 className="font-bold text-xl">Reddit Viewer</h1>;
    const end = (
        <span className="flex items-center justify-between gap-2">
            <Toggle_theme className="rounded-full h-10 w-10" />

            <a
                href="https://github.com/Aninda001/reddit_media_viewer"
                target="_blank"
                rel="noopener noreferrer"
            >
                <Avatar
                    icon="pi pi-github"
                    shape="circle"
                    className="h-10 w-10"
                />{" "}
            </a>
        </span>
    );

    return <Toolbar className="rounded-none" start={start} end={end} />;
}
