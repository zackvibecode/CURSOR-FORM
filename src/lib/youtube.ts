const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function parseYouTubeVideoId(url: string | undefined | null): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
      }

      const embedMatch = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];
    }
  } catch {
    // Fall through to raw ID check.
  }

  return YOUTUBE_ID_PATTERN.test(trimmed) ? trimmed : null;
}

export function buildYouTubeEmbedUrl(
  videoId: string,
  options: { autoplay?: boolean; mute?: boolean } = {}
): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });

  if (options.autoplay) {
    params.set("autoplay", "1");
    if (options.mute !== false) {
      params.set("mute", "1");
    }
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
