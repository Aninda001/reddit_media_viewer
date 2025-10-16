import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    allowedDevOrigins: ["127.0.0.1", "localhost", "0.0.0.0"],
    // async rewrites() {
    //     return [
    //         {
    //             source: "/u/:slug",
    //
    //             destination: "/?type=u&slug=:slug",
    //         },
    //
    //         {
    //             source: "/r/:slug",
    //
    //             destination: "/?type=r&slug=:slug",
    //         },
    //     ];
    // },
};

export default nextConfig;
