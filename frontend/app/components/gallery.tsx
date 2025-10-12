"use client";
import { useEffect, useState } from "react";
import MediaCard from "./media_card";
import { searchAtom } from "../page";
import { useAtom } from "jotai";
import { ProgressSpinner } from "primereact/progressspinner";

interface Media {
    kind: string; // "video", "image", "hls", etc.
    srcs?: string[]; // one or more source URLs (video sources, image src)
    poster?: string; // poster attribute for video
}

export interface Post {
    id?: string;
    subreddit?: string;
    subreddit_href?: string;
    author?: string;
    author_href?: string;
    title?: string;
    title_href?: string;
    media?: Media[];
}

interface PageLinks {
    next?: string;
    prev?: string;
}

interface ApiResponse {
    posts: Post[];
    page_links: PageLinks;
}

export default function Gallery() {
    const [posts, setPosts] = useState<ApiResponse>({
        posts: [],
        page_links: {},
    });
    const [search, setSearch] = useAtom(searchAtom);

    const getUrl = () => {
        let baseUrl = "http://localhost:8081";
        if (search.type === "search") {
            return `${baseUrl}/search?q=${search.query}&sort=${search.sort.toLowerCase()}&time=${search.time.toLowerCase()}`;
        } else if (search.type === "user") {
            return `${baseUrl}/user/${search.query}/submitted?sort=${search.sort.toLowerCase()}}`;
        } else if (search.type === "subreddit") {
            return `${baseUrl}/r/${search.query}?sort=${search.sort.toLowerCase()}&time=${search.time.toLowerCase()}`;
        }
        return baseUrl;
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!search.isSearching) return;
            setSearch((prev) => ({
                ...prev,
                isLoading: true,
            }));
            let url = getUrl();
            let res = await fetch(url);
            let data = await res.json();
            if (data.posts) setPosts(data);
            setSearch((prev) => ({
                ...prev,
                isLoading: false,
                isSearching: false,
            }));
        };
        fetchData();
    }, [search.isSearching]);
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {!search.isSearching &&
                    posts.posts.map((post: Post) => (
                        <MediaCard key={post.id} post={post} />
                    ))}
            </div>
            {search.isLoading && (
                <div className="card flex justify-content-center">
                    <ProgressSpinner />
                </div>
            )}
        </>
    );
}
