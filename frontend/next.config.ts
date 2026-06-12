import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    allowedDevOrigins: ["127.0.0.1", "localhost", "0.0.0.0", "10.151.82.10"],
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
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "i.redd.it", // Main image hosting
            },
            {
                protocol: "https",
                hostname: "preview.redd.it", // Image previews
            },
            {
                protocol: "https",
                hostname: "external-preview.redd.it", // External link previews
            },
            {
                protocol: "https",
                hostname: "v.redd.it", // Video hosting (useful for video posters/thumbnails)
            },
            // Add any other domains you might encounter, like Imgur or Giphy:
            // {
            //   protocol: 'https',
            //   hostname: 'i.imgur.com',
            // },
        ],
    },
};

export default nextConfig;
