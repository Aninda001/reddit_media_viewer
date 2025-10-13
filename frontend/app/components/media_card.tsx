import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import ReactPlayer from "react-player";
import { Post } from "./gallery";

export default function MediaCard({ post, ind }: { post: Post; ind: number }) {
    const header = (
        <div className="flex flex-nowrap gap-1 justify-between">
            <a
                href={post.subreddit_href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate p-4"
            >
                {post.subreddit}
            </a>
            <a
                href={post.author_href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 truncate p-4 justify-end"
            >
                {post.author}
            </a>
        </div>
    );

    return (
        <div className="card flex truncate justify-content-center">
            <Card
                title={post.title}
                subTitle={
                    post.media && post.media.length > 1 ? (
                        <Avatar
                            image="/image-gallery-svgrepo-com.svg"
                            className="text-white"
                            style={{
                                backgroundColor: "var(--primary-100)",
                            }}
                        />
                    ) : null
                }
                header={header}
                pt={{
                    root: { className: "w-full" },
                    title: {
                        className: "text-wrap font-normal leading-none text-lg",
                    },
                    body: { className: "pt-0" },
                }}
            >
                {post.media &&
                    (post.media[0].kind === "image" ? (
                        <img
                            alt="Card"
                            src={
                                post.media[0].srcs ? post.media[0].srcs[0] : ""
                            }
                            className="object-contain w-[100%] h-[300px] "
                            loading="lazy"
                        />
                    ) : (
                        <ReactPlayer
                            src={
                                post.media[0].srcs ? post.media[0].srcs[0] : ""
                            }
                            controls={true}
                            loop={true}
                            width="100%"
                            height="300px"
                            preload="metadata"
                            style={{ objectFit: "contain" }}
                            onError={(e) =>
                                console.log("Error loading video", e)
                            }
                        />
                    ))}
            </Card>
        </div>
    );
}
