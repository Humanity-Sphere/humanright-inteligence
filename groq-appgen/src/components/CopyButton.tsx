import { useState } from "react";
import { IoCopyOutline } from "react-icons/io5";
import { Tooltip } from "react-tooltip";
import { Button } from "./ui/button";

interface CopyButtonProps {
	code: string;
}

export function CopyButton({ code }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<>
			<Button
				onClick={handleCopy}
				variant="outline"
				size="icon"
				data-tooltip-id="copy-tooltip"
				data-tooltip-content={copied ? "Copied!" : "Copy code"}
			>
				<IoCopyOutline size={20} />
			</Button>
			<Tooltip
				id="copy-tooltip"
				place="left"
				className="!bg-gray-800 !px-2 !py-1 !text-sm !z-50"
			/>
		</>
	);
}
