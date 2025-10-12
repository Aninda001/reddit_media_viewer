"use client";
import { useState } from "react";
import Navbar from "./components/navbar";
import Search from "./components/search";
import Sort from "./components/sort_selection";
import Gallery from "./components/gallery";
import { atom } from "jotai";

export const searchAtom = atom({
  query: "",
  type: "subreddit",
  sort: "Relevance",
  time: "All",
  isLoading: false,
  isSearching: false,
});

export default function App() {
  return (
    <>
      <Navbar />
      <Search />
      <Sort />
      <main className="flex flex-col items-center justify-center ">
        <Gallery />
      </main>
    </>
  );
}
