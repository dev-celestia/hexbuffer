import { HighlightedText } from "@/components/highlighted-text";
import { useColoredUrl } from "./hooks/use-colored-url";

export function ColoredUrl({ url, searchQuery }: { url: string; searchQuery: string }) {
  const { hasQueryParams, base, pairs, paramColors } = useColoredUrl({ url });

  if (!hasQueryParams) {
    return <HighlightedText text={url} query={searchQuery} />;
  }

  return (
    <>
      <HighlightedText text={base} query={searchQuery} />
      {pairs.map((pair, i) => (
        <span key={i}>
          {i > 0 && <span className="text-muted-foreground">&</span>}
          <span style={{ color: paramColors[i % paramColors.length] }}>
            <HighlightedText text={pair} query={searchQuery} />
          </span>
        </span>
      ))}
    </>
  );
}
