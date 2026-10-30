import { privatePageMetadata } from "../noindex";

export const generateMetadata = privatePageMetadata("wishlist");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
