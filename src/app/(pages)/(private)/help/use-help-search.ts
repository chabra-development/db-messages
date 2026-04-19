import { useMemo, useState } from "react";
import { helpSections, HelpSection } from "./help-sections";

export function useHelpSearch(isAdmin: boolean) {
  const [search, setSearch] = useState("");

  const visibleSections = useMemo(
    () => helpSections.filter((s) => !s.badge || isAdmin),
    [isAdmin],
  );

  const filteredSections = useMemo<HelpSection[]>(() => {
    const query = search.toLowerCase().trim();
    if (!query) return visibleSections;

    return visibleSections
      .map((section) => {
        const sectionMatches =
          section.title.toLowerCase().includes(query) ||
          section.description.toLowerCase().includes(query) ||
          section.keywords.some((k) => k.includes(query));

        if (sectionMatches) return section;

        const filteredTopics = section.topics.filter(
          (t) =>
            t.question.toLowerCase().includes(query) ||
            t.answer.toLowerCase().includes(query),
        );

        if (filteredTopics.length > 0)
          return { ...section, topics: filteredTopics };

        return null;
      })
      .filter(Boolean) as HelpSection[];
  }, [search, visibleSections]);

  return { search, setSearch, filteredSections };
}
