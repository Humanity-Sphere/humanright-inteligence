import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ROOT_URL } from "@/utils/config";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getOgImageUrl(sessionId: string, version: string) {
	return `https://image.thum.io/get/${ROOT_URL}/api/apps/${sessionId}/${version}/raw`;
}
