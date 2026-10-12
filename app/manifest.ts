import type { MetadataRoute } from "next";

/** Lets the phone install L1 Study to the home screen (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "L1 Study",
    short_name: "L1 Study",
    description: "Personal Level I study companion",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#1e3a8a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
