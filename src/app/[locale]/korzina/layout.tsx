import { privatePageMetadata } from "../noindex";

export const generateMetadata = privatePageMetadata("cart");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
