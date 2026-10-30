import { InfoNav } from "./info-nav";

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[220px_1fr]">
      <aside>
        <InfoNav />
      </aside>
      <article className="min-w-0">{children}</article>
    </div>
  );
}
