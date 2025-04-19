import { useCallback, useEffect, useRef, useState } from "react";
import { IoShareOutline } from "react-icons/io5";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useStudio } from "@/providers/studio-provider";
import { Check, Copy } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { Checkbox } from "./ui/checkbox";

interface ShareButtonProps {
	sessionId?: string;
	version?: string;
	disabled?: boolean;
	signature: string;
}

export function ShareButton({
	sessionId,
	version,
	signature,
	disabled,
}: ShareButtonProps) {
	const { currentHtml } = useStudio();
	const { isCopied, copyToClipboard } = useCopyToClipboard({});
	const [status, setStatus] = useState<"idle" | "sharing" | "shared">("idle");
	const [open, setOpen] = useState(false);
	const [url, setUrl] = useState("");
	const [avoidGallery, setAvoidGallery] = useState(false);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

	// Ref for the input that appears after sharing
	const sharedInputRef = useRef<HTMLInputElement>(null);

	const handleShare = async () => {
		setStatus("sharing");
		const version = crypto.randomUUID();
		const response = await fetch(`/api/apps/${sessionId}/${version}`, {
			method: "POST",
			body: JSON.stringify({
				html: currentHtml,
				signature,
				title,
				description,
				avoidGallery,
			}),
		});
		if (!response.ok) {
			toast.error("Failed to share app");
			setStatus("idle");
			return;
		}
		const url = `/apps/${sessionId}/${version}`;
		setUrl(`${window.location.origin}${url}`);
		setStatus("shared");
	};

	const fetchSuggestions = useCallback(async () => {
		setIsLoadingSuggestions(true);
		try {
			const response = await fetch("/api/suggest", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ html: currentHtml }),
			});

			if (!response.ok) {
				throw new Error("Failed to fetch suggestions");
			}

			const suggestions = await response.json();
			setTitle(suggestions.title || "");
			setDescription(suggestions.description || "");
		} catch (error) {
			console.error("Error fetching suggestions:", error);
		} finally {
			setIsLoadingSuggestions(false);
		}
	}, [currentHtml]);

	const shareEnabled = title && description;

	// When status changes to "shared", focus and select the input text.
	useEffect(() => {
		if (status === "shared" && sharedInputRef.current) {
			sharedInputRef.current.focus();
			sharedInputRef.current.select();
		}
	}, [status]);

	useEffect(() => {
		if (version) {
			setStatus("idle");
		}
	}, [version]);

	useEffect(() => {
		if (open && status === "idle" && !title && !description) {
			fetchSuggestions();
		}
	}, [open, status, title, description, fetchSuggestions]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					disabled={disabled || status === "sharing"}
					variant="outline"
					data-tooltip-id="share-tooltip"
					data-tooltip-content={
						status === "sharing"
							? "Sharing..."
							: "Share your app&apos;s code"
					}
				>
					<IoShareOutline size={20} /> Share
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<div className="flex flex-col justify-center items-center w-full">
					{status === "sharing" && <div>Sharing...</div>}
					{status === "shared" && (
						<div className="flex flex-col justify-center items-center w-full">
							<h2 className="text-lg font-montserrat">Shared!</h2>
							<p className="text-sm text-gray-500 p-3">
								Your app has been shared! You can now share the link with your
								friends.
							</p>
							<div className="flex flex-col gap-2">
								<div className="text-sm font-medium">Link:</div>
								<div className="flex gap-2">
									<Input autoFocus value={url} ref={sharedInputRef} readOnly />
									<Button
										size="icon"
										onClick={() => copyToClipboard(url)}
										className=" shrink-0"
									>
										{isCopied ? <Check size={16} /> : <Copy size={16} />}
									</Button>
								</div>
								<div
									className={cn(
										"text-sm opacity-0 text-center",
										isCopied && "opacity-50",
									)}
								>
									Link copied to clipboard!
								</div>
								<div className="flex gap-2 justify-end">
									<Button variant="outline" onClick={() => setOpen(false)}>
										Close
									</Button>
									<Button onClick={() => window.open(url, "_blank")}>
										Open in new tab
									</Button>
								</div>
							</div>
						</div>
					)}
					{status === "idle" && (
						<div className="flex flex-col gap-6">
							<h2 className="text-lg font-montserrat">Share your app</h2>
							<p className="text-sm text-gray-500">
								{isLoadingSuggestions
									? "Generating suggestions..."
									: "These entries will be shown when you share them around."}
							</p>
							<div className="flex flex-col gap-2">
								<div className="text-sm font-medium">App name:</div>
								<div>
									<Input
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="e.g. Rainbow Calculator"
										disabled={isLoadingSuggestions}
									/>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<div className="text-sm font-medium">
									Describe your app in a few words:
								</div>
								<div>
									<Textarea
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="e.g. A calculator that shows the rainbow colors"
										disabled={isLoadingSuggestions}
									/>
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id="dontgallery"
									checked={avoidGallery}
									onCheckedChange={(checked) => setAvoidGallery(!!checked)}
								/>
								<label
									htmlFor="dontgallery"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Don&apos;t show in gallery
								</label>
							</div>
							<div className="flex justify-end">
								<Button
									onClick={handleShare}
									disabled={!shareEnabled || isLoadingSuggestions}
								>
									Share
								</Button>
							</div>
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
