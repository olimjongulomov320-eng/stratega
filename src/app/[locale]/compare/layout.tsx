import { privatePageMetadata } from "../noindex";

export const generateMetadata = privatePageMetadata("compare");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
