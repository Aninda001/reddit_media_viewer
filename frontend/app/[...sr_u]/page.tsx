"use client";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import App, { searchAtom } from "../page";
import { notFound } from "next/navigation";
import { useEffect } from "react";

export default function Sub_user() {
    const [search, setSearch] = useAtom(searchAtom);
    const { sr_u } = useParams<{ sr_u: string[] }>();

    if (sr_u.length !== 2 || (sr_u[0] !== "r" && sr_u[0] !== "u")) {
        notFound();
    }

    useEffect(() => {
        setSearch((prev) => ({
            ...prev,
            query: sr_u[1],
            type: sr_u[0] === "r" ? "subreddit" : "user",
            isSearching: true,
        }));
    }, []);

    return <App />;
}
