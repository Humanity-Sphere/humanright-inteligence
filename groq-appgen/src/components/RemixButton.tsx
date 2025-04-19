import { FiGitBranch } from "react-icons/fi";
import { Tooltip } from "react-tooltip";
import { Button } from "./ui/button";

interface RemixButtonProps {
	sessionId?: string;
	version?: string;
	disabled?: boolean;
}

export function RemixButton({
	sessionId,
	version,
	disabled,
}: RemixButtonProps) {
	const handleClick = () => {
		if (sessionId && version) {
			const sourceParam = `${sessionId}/${version}`;
			window.location.href = `/?source=${encodeURIComponent(sourceParam)}`;
		}
	};

	return (
		<>
			<Button
				onClick={handleClick}
				disabled={disabled}
				variant="outline"
				size="icon"
				data-tooltip-id="remix-tooltip"
				data-tooltip-content="Remix this app!"
			>
				<FiGitBranch className="w-5 h-5" />
			</Button>
			<Tooltip id="remix-tooltip" />
		</>
	);
}
