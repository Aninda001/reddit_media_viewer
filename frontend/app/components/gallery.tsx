"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import MediaCard from "./media_card";
import { searchAtom } from "../page";
import { useAtom } from "jotai";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import ReactPlayer from "react-player";
// use react-player 2.16.1 the latest version have type issue
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
    const [selectedPostIndex, setSelectedPostIndex] = useState<{
        pind: number;
        mind: number;
    } | null>(null);
    const [visible, setVisible] = useState(false);
    const playerRef = useRef<HTMLVideoElement | null>(null);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    const getUrl = () => {
        let baseUrl = "http://localhost:8081";
        if (search.type === "search") {
            return `${baseUrl}/search?q=${search.query}&sort=${search.sort.toLowerCase()}&time=${search.time.toLowerCase()}`;
        } else if (search.type === "user") {
            return `${baseUrl}/user/${search.query}/submitted?sort=${search.sort.toLowerCase()}`;
        } else if (search.type === "subreddit") {
            return `${baseUrl}/r/${search.query}/${search.sort.toLowerCase()}?time=${search.time.toLowerCase()}`;
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
            setPosts(data);
            setSearch((prev) => ({
                ...prev,
                isLoading: false,
                isSearching: false,
            }));
        };
        fetchData();
    }, [search.isSearching]);

    const loadMore = async () => {
        if (!posts.page_links.next) return;
        setSearch((prev) => ({
            ...prev,
            isLoading: true,
        }));
        let url = getUrl() + `&after=${posts.page_links.next}`;
        let res = await fetch(url);
        let data = await res.json();
        setPosts((prev) => ({
            posts: [...prev.posts, ...data.posts],
            page_links: data.page_links,
        }));

        setSearch((prev) => ({
            ...prev,
            isLoading: false,
        }));
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const target = entries[0];
                if (
                    target.isIntersecting &&
                    !search.isLoading &&
                    !search.isSearching &&
                    posts.page_links.next
                ) {
                    loadMore();
                }
            },
            { rootMargin: "300px" },
        );
        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }
        return () => {
            observer.disconnect();
        };
    }, [posts.page_links.next, search.isLoading, search.isSearching]);

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
        setSelectedPostIndex({ pind: index, mind: 0 });
        setVisible(true);
        if (!search.isLoading && index >= posts.posts.length - 5) {
            loadMore();
        }
    };

    const closeDialog = () => {
        setVisible(false);
        setSelectedPostIndex(null);
    };

    const goToNext = () => {
        if (selectedPostIndex === null) return;

        const { pind, mind } = selectedPostIndex;
        const currentPost = posts.posts[pind];

        if (!currentPost?.media) return;
        else if (mind < currentPost.media.length - 1) {
            setSelectedPostIndex({ pind, mind: mind + 1 });
        } else if (pind < posts.posts.length - 1) {
            const nextPost = posts.posts[pind + 1];

            if (nextPost?.media && nextPost.media.length > 0) {
                setSelectedPostIndex({ pind: pind + 1, mind: 0 });
            }
        }
        if (!search.isLoading && pind >= posts.posts.length - 5) {
            loadMore();
        }
    };

    const goToPrev = () => {
        if (selectedPostIndex === null) return;

        const { pind, mind } = selectedPostIndex;

        if (mind > 0) {
            setSelectedPostIndex({ pind, mind: mind - 1 });
        } else if (pind > 0) {
            const prevPost = posts.posts[pind - 1];

            if (prevPost?.media && prevPost.media.length > 0) {
                setSelectedPostIndex({
                    pind: pind - 1,

                    mind: prevPost.media.length - 1,
                });
            }
        }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
        if (!visible) return;
        if (e.key === "ArrowDown") goToNext();
        if (e.key === "ArrowUp") goToPrev();

        if (e.key === " " && playerRef.current) {
            if (playerRef.current?.paused) {
                playerRef.current.play();
            } else {
                playerRef.current.pause();
            }
        }
        if (e.key === "ArrowRight") {
            if (playerRef.current) {
                playerRef.current.currentTime += 5;
            }
        }
        if (e.key === "ArrowLeft") {
            if (playerRef.current) {
                playerRef.current.currentTime -= 5;
            }
        }
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [visible, selectedPostIndex]);

    const currentPost = useMemo(
        () =>
            selectedPostIndex !== null
                ? posts.posts[selectedPostIndex.pind]
                : null,

        [selectedPostIndex, posts.posts],
    );
    const currentMedia = useMemo(
        () =>
            selectedPostIndex !== null && currentPost?.media
                ? currentPost.media[selectedPostIndex.mind]
                : null,

        [selectedPostIndex, currentPost],
    );
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {!search.isSearching &&
                    posts.posts?.map((post: Post, index: number) => (
                        <MediaCard
                            key={post.id}
                            post={post}
                            click={handleCardClick}
                            index={index}
                            customClass="cursor-pointer"
                        />
                    ))}
            </div>
            {search.isLoading && (
                <div className="card flex justify-content-center">
                    <ProgressSpinner />
                </div>
            )}
            <div ref={loaderRef} className="h-4" />
            {visible && (
                <div
                    className="fixed inset-0 w-full h-full z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
                    // onClick={closeDialog}
                    //to stop closing when clicking
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
                            {currentMedia && currentMedia.kind === "image" ? (
                                <img
                                    src={currentMedia.srcs?.[0] || ""}
                                    key={currentMedia.srcs?.[0] || ""}
                                    alt={currentPost?.title}
                                    className="max-w-[95%] max-h-full object-contain"
                                />
                            ) : (
                                <ReactPlayer
                                    ref={playerRef}
                                    src={currentMedia?.srcs?.[0] || ""}
                                    key={currentMedia?.srcs?.[0] || ""}
                                    controls={true}
                                    loop={true}
                                    onCanPlayThrough={() => {
                                        playerRef.current?.play();
                                    }}
                                    width="95%"
                                    height="100%"
                                    style={{ objectFit: "contain" }}
                                    onError={(e) => console.log(e)}
                                />
                            )}
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
                            disabled={
                                selectedPostIndex?.pind === 0 &&
                                selectedPostIndex?.mind === 0
                            }
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
                                selectedPostIndex?.pind ===
                                    posts.posts.length - 1 &&
                                selectedPostIndex?.mind ===
                                    (currentPost?.media?.length || 1) - 1
                            }
                        />
                        <div className="absolute bottom-0 left-0 right-0 z-50 gap-2 flex justify-center px-6 py-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                            {selectedPostIndex !== null && (
                                <>
                                    <Chip
                                        label={`Post : ${selectedPostIndex.pind + 1} / ${posts.posts.length}`}
                                    />
                                    <Chip
                                        label={`Media : ${selectedPostIndex.mind + 1} / ${currentPost?.media?.length}`}
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
