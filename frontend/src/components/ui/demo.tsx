import { ArcGalleryHero } from "@/components/ui/arc-gallery-hero-component";

export default function DemoOne() {
	const memoryImages = [
		"https://images.unsplash.com/photo-1755004609214-c252674df1ca?q=80&w=400&auto=format&fit=crop",
		"https://images.unsplash.com/photo-1750218537952-0ae056c7f53a?q=80&w=400&auto=format&fit=crop",
		"https://images.unsplash.com/photo-1755038995605-038a7345658f?q=80&w=400&auto=format&fit=crop",
		"https://images.unsplash.com/photo-1546238232-20216dec9f72?q=80&w=400&auto=format&fit=crop",
		"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop",
		"https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=400&auto=format&fit=crop",
		"https://images.unsplash.com/photo-1753724223372-9a1df8eb5212?q=80&w=400&auto=format&fit=crop",
		"https://images.unsplash.com/photo-1754079132860-5b37dab49daa?q=80&w=400&auto=format&fit=crop",
		"https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400&auto=format&fit=crop",
		"https://images.unsplash.com/photo-1754079132962-2f6c62f14d33?q=80&w=400&auto=format&fit=crop",
		"https://images.unsplash.com/photo-1754764987594-2236e7736115?q=80&w=400&auto=format&fit=crop",
		"https://images.unsplash.com/photo-1755048796967-75a82d214846?q=80&w=400&auto=format&fit=crop",
	];

	return (
		<div className="w-full">
			<ArcGalleryHero images={memoryImages} />
		</div>
	);
}
