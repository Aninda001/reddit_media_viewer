"use client";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual"; // Note the change here
import MediaCard from "./media_card";
import { searchAtom } from "../page";
import { useAtom } from "jotai";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import ReactPlayer from "react-player";
import { useSwipeable } from "react-swipeable";
import { Chip } from "primereact/chip";

interface Media {
    kind: string;
    srcs?: string[];
    poster?: string;
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

    // Track window width to calculate columns (replaces the ResizeObserver on a wrapper div)
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1024,
    );

    const getUrl = () => {
        let baseUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
        if (search.type === "search")
            return `${baseUrl}/search?q=${search.query}&sort=${search.sort.toLowerCase()}&time=${search.time.toLowerCase()}`;
        else if (search.type === "user")
            return `${baseUrl}/user/${search.query}/submitted?sort=${search.sort.toLowerCase()}`;
        else if (search.type === "subreddit")
            return `${baseUrl}/r/${search.query}/${search.sort.toLowerCase()}?time=${search.time.toLowerCase()}`;
        return baseUrl;
    };

    const handleSwipe = useSwipeable({
        onSwipedLeft: () => goToNext(),
        onSwipedRight: () => goToPrev(),
        onSwipedUp: () => goToNext(),
        onSwipedDown: () => goToPrev(),
    });

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!search.isSearching) return;
            setPosts({ posts: [], page_links: {} }); // Clear old posts immediately
            setSearch((prev) => ({ ...prev, isLoading: true }));
            try {
                let res = await fetch(getUrl());
                if (!res.ok)
                    throw new Error(`HTTP error! status: ${res.status}`);
                let data = await res.json();
                setPosts(data);
                setSearch((prev) => ({
                    ...prev,
                    isLoading: false,
                    isSearching: false,
                }));
            } catch (error) {
                console.error("Error fetching data:", error);
                setSearch((prev) => ({
                    ...prev,
                    isLoading: false,
                    isSearching: false,
                }));
            }
        };
        fetchData();
    }, [search.isSearching]);

    const loadMore = useCallback(async () => {
        if (!posts.page_links.next) return;
        setSearch((prev) => ({ ...prev, isLoading: true }));
        try {
            let res = await fetch(getUrl() + `&after=${posts.page_links.next}`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            let data = await res.json();
            setPosts((prev) => ({
                posts: [...prev.posts, ...data.posts],
                page_links: data.page_links,
            }));
            setSearch((prev) => ({ ...prev, isLoading: false }));
        } catch (error) {
            console.error("Error fetching data:", error);
            setSearch((prev) => ({ ...prev, isLoading: false }));
        }
    }, [posts.page_links.next]);

    const columns = useMemo(() => {
        if (windowWidth >= 1024) return 3;
        if (windowWidth >= 768) return 2;
        return 1;
    }, [windowWidth]);

    const rows = useMemo(() => {
        const result = [];
        for (let i = 0; i < posts.posts.length; i += columns) {
            result.push(posts.posts.slice(i, i + columns));
        }
        return result;
    }, [posts.posts, columns]);

    // USE WINDOW VIRTUALIZER: Attaches directly to the native window scrollbar
    const rowVirtualizer = useWindowVirtualizer({
        count: rows.length,
        estimateSize: () => 350,
        overscan: 5,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();
    const lastVirtualItem = virtualItems[virtualItems.length - 1];

    useEffect(() => {
        if (!lastVirtualItem) return;
        if (
            lastVirtualItem.index >= rows.length - 2 &&
            !search.isLoading &&
            !search.isSearching &&
            posts.page_links.next
        ) {
            loadMore();
        }
    }, [
        lastVirtualItem?.index,
        rows.length,
        search.isLoading,
        search.isSearching,
        posts.page_links.next,
        loadMore,
    ]);

    useEffect(() => {
        document.body.style.overflow = visible ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [visible]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape" && visible) setVisible(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [visible]);

    const handleCardClick = (index: number) => {
        setSelectedPostIndex({ pind: index, mind: 0 });
        setVisible(true);
    };

    const closeDialog = () => {
        setVisible(false);
        setSelectedPostIndex(null);
    };

    const goToNext = useCallback(() => {
        if (selectedPostIndex === null) return;
        const { pind, mind } = selectedPostIndex;
        const currentPost = posts.posts[pind];
        if (!currentPost?.media) return;
        if (mind < currentPost.media.length - 1)
            setSelectedPostIndex({ pind, mind: mind + 1 });
        else if (pind < posts.posts.length - 1) {
            const nextPost = posts.posts[pind + 1];
            if (nextPost?.media && nextPost.media.length > 0)
                setSelectedPostIndex({ pind: pind + 1, mind: 0 });
        }
        if (!search.isLoading && pind >= posts.posts.length - 5) loadMore();
    }, [selectedPostIndex, posts, search.isLoading, loadMore]);

    const goToPrev = useCallback(() => {
        if (selectedPostIndex === null) return;
        const { pind, mind } = selectedPostIndex;
        if (mind > 0) setSelectedPostIndex({ pind, mind: mind - 1 });
        else if (pind > 0) {
            const prevPost = posts.posts[pind - 1];
            if (prevPost?.media && prevPost.media.length > 0)
                setSelectedPostIndex({
                    pind: pind - 1,
                    mind: prevPost.media.length - 1,
                });
        }
    }, [selectedPostIndex, posts]);

    const handleKeyPress = useCallback(
        (e: KeyboardEvent) => {
            if (!visible) return;
            if (e.key === "ArrowDown") goToNext();
            if (e.key === "ArrowUp") goToPrev();
            if (e.key === " " && playerRef.current)
                playerRef.current.paused
                    ? playerRef.current.play()
                    : playerRef.current.pause();
            if (e.key === "ArrowRight" && playerRef.current)
                playerRef.current.currentTime += 5;
            if (e.key === "ArrowLeft" && playerRef.current)
                playerRef.current.currentTime -= 5;
        },
        [visible, goToNext, goToPrev],
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [handleKeyPress]);

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
            {/* NO WRAPPER DIV NEEDED. Renders directly into your normal layout flow. */}
            {search.isLoading && posts.posts.length === 0 ? (
                <div className="flex justify-center py-10">
                    <ProgressSpinner />
                </div>
            ) : (
                <>
                    {/* This invisible div just tells the window scrollbar how tall the page is */}
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: "100%",
                            position: "relative",
                        }}
                    >
                        {virtualItems.map((virtualRow) => {
                            const rowPosts = rows[virtualRow.index];
                            return (
                                <div
                                    key={virtualRow.key}
                                    data-index={virtualRow.index}
                                    ref={rowVirtualizer.measureElement}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
                                >
                                    {rowPosts.map((post, colIndex) => {
                                        const actualIndex =
                                            virtualRow.index * columns +
                                            colIndex;
                                        return (
                                            <MediaCard
                                                key={post.id || actualIndex}
                                                post={post}
                                                click={handleCardClick}
                                                index={actualIndex}
                                                customClass="cursor-pointer h-full"
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    {search.isLoading && posts.posts.length > 0 && (
                        <div className="flex justify-center py-4">
                            <ProgressSpinner />
                        </div>
                    )}
                </>
            )}

            {/* Modal code remains completely untouched */}
            {visible && (
                <div className="fixed inset-0 w-full h-full z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
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

                        <div
                            {...handleSwipe}
                            className="max-w-full mx-4 max-h-full flex items-center justify-center pt-20 pb-16 w-[95%] h-full"
                        >
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
                            className="hidden md:flex absolute left-4 z-40 top-1/2 -translate-y-1/2"
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
                            className="hidden md:flex absolute right-4 z-40 top-1/2 -translate-y-1/2"
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
