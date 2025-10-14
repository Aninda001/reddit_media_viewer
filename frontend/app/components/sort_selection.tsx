import React, { useEffect } from "react";
import { SelectButton, SelectButtonChangeEvent } from "primereact/selectbutton";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { useAtom } from "jotai";
import { searchAtom } from "../page";

export default function Sort() {
    const searchOptions: string[] = [
        "Relevance",
        "Hot",
        "Top",
        "New",
        "Comments",
    ];
    const sr_userOptions: string[] = [
        "Hot",
        "Top",
        "New",
        "Rising",
        "Controversial",
    ];
    const timeOptions: string[] = [
        "All",
        "Year",
        "Month",
        "Week",
        "Day",
        "Hour",
    ];
    const [search, setSearch] = useAtom(searchAtom);
    useEffect(() => {
        const currentOptions =
            search.type === "search" ? searchOptions : sr_userOptions;

        if (!currentOptions.includes(search.sort)) {
            setSearch((prev) => ({
                ...prev,
                sort: currentOptions[0],
            }));
        }
    }, [search.type]);

    return (
        <div className="card flex justify-between ">
            <SelectButton
                value={search.sort}
                onChange={(e: SelectButtonChangeEvent) =>
                    setSearch((prev) => ({
                        ...prev,
                        sort: e.value,
                    }))
                }
                options={
                    search.type === "search" ? searchOptions : sr_userOptions
                }
                className="hidden lg:flex rounded-t-none"
            />
            <Dropdown
                value={search.sort}
                onChange={(e: DropdownChangeEvent) =>
                    setSearch((prev) => ({
                        ...prev,
                        sort: e.value,
                    }))
                }
                options={
                    search.type === "search" ? searchOptions : sr_userOptions
                }
                className="lg:hidden w-full rounded-t-none"
            />
            {search.type !== "subreddit" && (
                <>
                    <Dropdown
                        value={search.time}
                        onChange={(e: DropdownChangeEvent) =>
                            setSearch((prev) => ({
                                ...prev,
                                time: e.value,
                            }))
                        }
                        options={timeOptions}
                        className="lg:hidden w-full rounded-t-none"
                    />
                    <SelectButton
                        value={search.time}
                        onChange={(e: SelectButtonChangeEvent) =>
                            setSearch((prev) => ({
                                ...prev,
                                time: e.value,
                            }))
                        }
                        options={timeOptions}
                        className="hidden lg:flex rounded-t-none"
                    />
                </>
            )}
        </div>
    );
}
