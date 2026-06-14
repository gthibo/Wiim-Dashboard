import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_VERSION, REPO_URL, RELEASE_URL } from "@/lib/version";

/** Subtle credit footer shown across the app. */
export function AppFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "flex items-center justify-center gap-1.5 py-6 text-center text-xs text-muted-foreground/60",
        className,
      )}
    >
      <Sparkles className="size-3.5 text-primary/60" />
      <span>
        Vibe coding by{" "}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          illiano
        </a>
        <span className="px-1 text-muted-foreground/40">·</span>
        <a
          href={RELEASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium tabular-nums transition-colors hover:text-foreground"
        >
          v{APP_VERSION}
        </a>
      </span>
    </footer>
  );
}
