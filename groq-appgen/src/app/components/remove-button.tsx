"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface RemoveButtonProps {
	sessionId: string;
	version: string;
}

export function RemoveButton({ sessionId, version }: RemoveButtonProps) {
	const [isRemoving, setIsRemoving] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();

	const handleRemove = async () => {
		try {
			setIsRemoving(true);
			const response = await fetch(`/api/apps/${sessionId}/${version}/remove`, {
				method: "POST",
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error || "Failed to remove app");
			}

			toast.success("App removed successfully");
			// Navigate back to gallery after successful removal
			router.push("/gallery");
		} catch (error) {
			console.error("Error removing app:", error);
			toast.error(error instanceof Error ? error.message : "Failed to remove app");
		} finally {
			setIsRemoving(false);
			setIsOpen(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="destructive"
					disabled={isRemoving}
					className="flex items-center gap-2"
				>
					<Trash2 size={16} />
					{isRemoving ? "Removing..." : "Remove"}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Remove App</DialogTitle>
					<DialogDescription>
						Are you sure you want to remove this app? This action CANNOT be undone
						and the app will be permanently deleted.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => setIsOpen(false)}>
						Cancel
					</Button>
					<Button variant="destructive" onClick={handleRemove} disabled={isRemoving}>
						{isRemoving ? "Removing..." : "Remove App"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
