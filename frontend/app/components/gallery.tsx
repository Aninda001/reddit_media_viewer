"use client";
import { useEffect, useState, useRef } from "react";
import MediaCard from "./media_card";
import { searchAtom } from "../page";
import { useAtom } from "jotai";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import ReactPlayer from "react-player";
import { Chip } from "primereact/chip";

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
    const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(
        null,
    );
    const [visible, setVisible] = useState(false);

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

    useEffect(() => {
        if (visible) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [visible]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape" && visible) {
                setVisible(false);
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [visible]);

    const handleCardClick = (index: number) => {
        setSelectedPostIndex(index);
        setVisible(true);
    };

    const closeDialog = () => {
        setVisible(false);
        setSelectedPostIndex(null);
    };

    const goToNext = () => {
        if (
            selectedPostIndex !== null &&
            selectedPostIndex < posts.posts.length - 1
        ) {
            setSelectedPostIndex(selectedPostIndex + 1);
        }
    };

    const goToPrev = () => {
        if (selectedPostIndex !== null && selectedPostIndex > 0) {
            setSelectedPostIndex(selectedPostIndex - 1);
        }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
        if (!visible) return;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") goToNext();
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") goToPrev();
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [visible, selectedPostIndex]);

    const currentPost =
        selectedPostIndex !== null ? posts.posts[selectedPostIndex] : null;
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {!search.isSearching &&
                    posts.posts.map((post: Post, index: number) => (
                        <div
                            key={post.id}
                            onClick={() => handleCardClick(index)}
                            className="cursor-pointer"
                        >
                            <MediaCard key={post.id} post={post} />
                        </div>
                    ))}
            </div>
            {search.isLoading && (
                <div className="card flex justify-content-center">
                    <ProgressSpinner />
                </div>
            )}
            {visible && (
                <div
                    className="fixed inset-0 w-full h-full z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
                // onClick={closeDialog} //to stop closing when clicking
                >
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                            <div className="flex-1 min-w-0 mr-4">
                                <h3 className="text-white text-base font-medium text-pretty">
                                    {currentPost?.title}
                                </h3>

                                {currentPost && (
                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                                        <a
                                            href={currentPost.subreddit_href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-white transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {currentPost.subreddit}
                                        </a>
                                        <span>•</span>
                                        <a
                                            href={currentPost.author_href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-white transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {currentPost.author}
                                        </a>
                                    </div>
                                )}
                            </div>
                            <Button
                                icon="pi pi-times"
                                rounded
                                onClick={closeDialog}
                                outlined
                                severity="danger"
                                aria-label="Close"
                            />
                        </div>

                        <div className="max-w-full mx-4 max-h-full flex items-center justify-center pt-20 pb-16">
                            {currentPost?.media &&
                                currentPost.media.length > 0 &&
                                (currentPost.media[0].kind === "image" ? (
                                    <img
                                        src={
                                            currentPost.media[0].srcs?.[0] || ""
                                        }
                                        alt={currentPost.title}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                ) : (
                                    <ReactPlayer
                                        src={
                                            currentPost.media[0].srcs?.[0] || ""
                                        }
                                        controls={true}
                                        loop={true}
                                        // playing={true}
                                        width="90%"
                                        height="90%"
                                    />
                                ))}
                        </div>

                        <Button
                            icon="pi pi-chevron-left"
                            rounded
                            outlined
                            onClick={(e) => {
                                e.stopPropagation();

                                goToPrev();
                            }}
                            className="absolute left-4 z-40 top-1/2 -translate-y-1/2"
                            disabled={selectedPostIndex === 0}
                            severity="info"
                            aria-label="Previous"
                        />

                        <Button
                            icon="pi pi-chevron-right"
                            rounded
                            outlined
                            onClick={(e) => {
                                e.stopPropagation();

                                goToNext();
                            }}
                            className="absolute right-4 z-40 top-1/2 -translate-y-1/2"
                            severity="info"
                            aria-label="Next"
                            disabled={
                                selectedPostIndex === posts.posts.length - 1
                            }
                        />
                        <div className="absolute bottom-0 left-0 right-0 z-50 gap-2 flex justify-center px-6 py-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                            {selectedPostIndex !== null && (
                                <>
                                    <Chip
                                        label={`Post : ${selectedPostIndex + 1} / ${posts.posts.length}`}
                                    />
                                    <Chip
                                        label={`Media : ${currentPost?.media?.length || 0}`}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
