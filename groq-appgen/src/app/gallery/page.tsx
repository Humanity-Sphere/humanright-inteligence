"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { GalleryListing } from "../components/gallery-listing";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function GalleryPage() {
	const [view, setView] = useState<"trending" | "popular" | "new">("popular");

	return (
		<main className="p-4">
			<div className="flex items-center gap-2 mb-6">
				<Link href="/" className="w-10 h-10 flex items-center justify-center">
					<ArrowLeft size={20} />
				</Link>
				<h1 className="font-montserrat text-[2em] font-light">Gallery</h1>
			</div>

			<div className="mb-8 flex justify-center">
				<Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="w-full max-w-md">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="trending">Trending</TabsTrigger>
						<TabsTrigger value="popular">Popular</TabsTrigger>
						<TabsTrigger value="new">New</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			<GalleryListing view={view} />
		</main>
	);
}
