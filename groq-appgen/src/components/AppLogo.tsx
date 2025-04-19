import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import Image from "next/image";
import React from "react";

export default function AppLogo({ className, size = 80 }: { className?: string; size?: number }) {
	const { resolvedTheme, theme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	// Avoid hydration mismatch by using a default theme before mounting
	const logoSrc = !mounted ? "/groqlabs_logo-black.png" : 
		(resolvedTheme === "dark" ? "/groqlabs_logo-white.png" : "/groqlabs_logo-black.png");

	return (
		<div className={cn("flex flex-col items-center gap-2", className)}>
			<Image 
				src={logoSrc} 
				alt="Groq" 
				width={size} 
				height={size}
				style={{ width: 'auto', height: size/3.41333333333 }}
			/>
		</div>
	);
}
