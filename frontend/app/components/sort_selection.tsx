import React, { useState } from "react";
import { SelectButton, SelectButtonChangeEvent } from "primereact/selectbutton";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { useAtom } from "jotai";
import { searchAtom } from "../page";

export default function Sort() {
    const justifyOptions: string[] = [
        "Relevance",
        "Hot",
        "Top",
        "New",
        "Comments",
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
                options={justifyOptions}
                className="hidden md:flex rounded-t-none"
            />
            <Dropdown
                value={search.sort}
                onChange={(e: DropdownChangeEvent) =>
                    setSearch((prev) => ({
                        ...prev,
                        sort: e.value,
                    }))
                }
                options={justifyOptions}
                className="md:hidden w-full rounded-t-none"
            />
            <Dropdown
                value={search.time}
                onChange={(e: DropdownChangeEvent) =>
                    setSearch((prev) => ({
                        ...prev,
                        time: e.value,
                    }))
                }
                options={timeOptions}
                className="md:hidden w-full rounded-t-none"
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
                className="hidden md:flex rounded-t-none"
            />
        </div>
    );
}
