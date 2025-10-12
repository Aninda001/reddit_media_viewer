import React from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import ReactPlayer from "react-player";
import { Post } from "./gallery";

export default function MediaCard({ post }: { post: Post }) {
    const header = (
        <div className="flex flex-nowrap gap-1 ">
            <Button
                label={
                    post.subreddit +
                    "fhjfvbhdsfdhfdsgfdhsfdfvhdsh, fsvhdsggdfgdfgdfgdfg"
                }
                link
                pt={{ label: { className: "truncate " } }}
                className="flex-1 "
                onClick={() => window.open(post.subreddit_href, "_blank")}
            />
            <Button
                label={post.author}
                link
                pt={{ label: { className: "truncate " } }}
                className="flex-1"
                onClick={() => window.open(post.author_href, "_blank")}
            />
        </div>
    );
    const footer = (
        <>
            <Button label="Save" icon="pi pi-check" />
            <Button
                label="Cancel"
                severity="secondary"
                icon="pi pi-times"
                style={{ marginLeft: "0.5em" }}
            />
        </>
    );

    return (
        <div className="card flex truncate justify-content-center ">
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
                // footer={footer}
                header={header}
                // className="bg-neutral-500"
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
                            style={{ objectFit: "contain" }}
                        />
                    ))}
            </Card>
        </div>
    );
}
