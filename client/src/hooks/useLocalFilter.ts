/**
 * useLocalFilter.ts — Generic client-side search + tab filter hook
 * Works with any array of objects. Zero dependencies beyond React.
 */
import { useState, useMemo } from "react";

interface FilterConfig<T> {
  items: T[];
  /** Fields to search across (dot-notation not supported — flat keys only) */
  searchFields: (keyof T)[];
  /** Key to filter by tab value — if undefined, tab filter is skipped */
  tabKey?: keyof T;
  /** Initial tab value */
  defaultTab?: string;
}

export function useLocalFilter<T>({
  items,
  searchFields,
  tabKey,
  defaultTab = "all",
}: FilterConfig<T>) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(defaultTab);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((item) => {
      // Tab filter
      if (tabKey && activeTab !== "all") {
        if (String(item[tabKey]) !== activeTab) return false;
      }
      // Search filter
      if (!q) return true;
      return searchFields.some((field) =>
        String(item[field] ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search, activeTab, searchFields, tabKey]);

  return { search, setSearch, activeTab, setActiveTab, filtered };
}
