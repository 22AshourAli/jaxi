"use client";

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center" dir="ltr">
      <h1 className="text-4xl font-bold text-destructive">Something went wrong</h1>
      <p className="text-muted-foreground">{error.message}</p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
