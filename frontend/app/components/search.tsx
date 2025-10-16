import React from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { useAtom } from "jotai";
import { searchAtom } from "../page";

const Options: string[] = ["subreddit", "user", "search"];

export default function Search() {
    const [search, setSearch] = useAtom(searchAtom);
    const clickhandler = () => {
        if (search.query.trim() === "" && search.type !== "search") return;
        if (!search.isSearching) {
            setSearch((prev) => ({
                ...prev,
                isSearching: true,
            }));
        }
        window.history.replaceState(null, "", "/");
    };

    return (
        <div className="card flex flex-column md:flex-row gap-3">
            <div className="p-inputgroup md:flex-1">
                <Dropdown
                    value={search.type}
                    onChange={(e: DropdownChangeEvent) =>
                        setSearch((prev) => ({
                            ...prev,
                            type: e.value,
                        }))
                    }
                    options={Options}
                    placeholder="Select a Type"
                    className="w-auto md:w-40 grow-0 md:shrink-0 rounded-none"
                />
                <InputText
                    placeholder="Search"
                    value={search.query}
                    onChange={(e) =>
                        setSearch((prev) => ({
                            ...prev,
                            query: e.target.value,
                        }))
                    }
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            clickhandler();
                        }
                    }}
                />
                <Button
                    icon="pi pi-search"
                    label="Search"
                    className="rounded-none"
                    onClick={clickhandler}
                    disabled={search.isSearching}
                    pt={{ label: { className: "max-md:hidden" } }}
                />
            </div>
        </div>
    );
}
