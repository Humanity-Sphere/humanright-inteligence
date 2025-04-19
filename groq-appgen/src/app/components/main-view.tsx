import { useEffect } from "react";
import PromptView from "./prompt-view";
import StudioView from "./studio-view";
import { useStudio } from "@/providers/studio-provider";

export default function MainView() {
	const { studioMode, setStudioMode } = useStudio();

	useEffect(() => {
		if (location.search.startsWith("?source=")) {
			setStudioMode(true);
		}
	}, [setStudioMode]);

	if (studioMode) {
		return <StudioView />;
	}

	return <PromptView />;
}
