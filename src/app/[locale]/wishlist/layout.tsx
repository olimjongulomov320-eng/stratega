import { NOINDEX } from "../noindex";

export const metadata = NOINDEX;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
