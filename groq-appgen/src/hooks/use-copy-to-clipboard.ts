import * as React from "react";

export interface useCopyToClipboardProps {
	timeout?: number;
}

export function useCopyToClipboard({
	timeout = 2000,
}: useCopyToClipboardProps) {
	const [isCopied, setIsCopied] = React.useState<boolean>(false);

	const copyToClipboard = async (value: string) => {
		if (typeof window === "undefined" || !value) {
			return;
		}

		try {
			// Try using the Clipboard API first
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(value);
				setIsCopied(true);
			} else {
				// Fallback for browsers that don't support clipboard API
				const textarea = document.createElement("textarea");
				textarea.value = value;
				textarea.style.position = "fixed";
				textarea.style.left = "-999999px";
				textarea.style.top = "-999999px";
				document.body.appendChild(textarea);
				textarea.focus();
				textarea.select();
				
				try {
					document.execCommand("copy");
					setIsCopied(true);
				} catch (err) {
					console.error("Failed to copy text:", err);
					return;
				} finally {
					document.body.removeChild(textarea);
				}
			}

			setTimeout(() => {
				setIsCopied(false);
			}, timeout);
		} catch (err) {
			console.error("Failed to copy text:", err);
		}
	};

	return { isCopied, copyToClipboard };
}
