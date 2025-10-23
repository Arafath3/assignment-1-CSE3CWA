// app/about/page.tsx
export const metadata = { title: "About" };

const VIDEO_ID = process.env.NEXT_PUBLIC_YT_ID || "NGg9gcN4j_8"; // e.g. "dQw4w9WgXcQ"

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">About this website</h1>
      <p>
        This is my assignment 2 project. The video below is a short walkthrough
        explaining how everything works.
      </p>

      {/* Responsive 16:9 embed */}
      <div
        className="relative w-full overflow-hidden rounded-lg border border-border shadow"
        style={{ paddingTop: "56.25%" }}
      >
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://youtu.be/NGg9gcN4j_8`}
          title="Assignment walkthrough by YOUR NAME"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        If the player doesn’t load (e.g., privacy settings), open directly:{" "}
        <a
          href={`https://youtu.be/${VIDEO_ID}`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          YouTube link
        </a>
        .
      </p>
    </div>
  );
}
