import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Deterministic placeholder avatar from a name. Used everywhere a person is
// shown without an uploaded profile image (students, teachers, staff, children).
export function dummyAvatar(name?: string | null): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random&size=128`;
}

// Two-letter initials fallback (e.g. for solid-color avatar tiles).
export function initialsOf(name?: string | null): string {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
