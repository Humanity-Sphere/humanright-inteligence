"use client";

import { StudioProvider } from "@/providers/studio-provider";
import MainView from "./components/main-view";

export default function Home() {
	return (
		<StudioProvider>
			<MainView />
		</StudioProvider>
	);
}
