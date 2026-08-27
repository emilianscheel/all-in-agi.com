declare module 'pdfkit' {
	interface PDFDocumentOptions {
		size?: [number, number];
		margin?: number;
		autoFirstPage?: boolean;
	}

	export default class PDFKitDocument {
		constructor(options?: PDFDocumentOptions);
		on(event: string, listener: (...args: any[]) => void): this;
		end(): void;
	}

	export function registerStdFonts(...fonts: unknown[]): void;
}

declare module 'pdfkit/standard-fonts/Helvetica' {
	const Helvetica: unknown;
	export default Helvetica;
}

declare module 'svg-to-pdfkit' {
	interface SvgToPdfOptions {
		width?: number;
		height?: number;
		assumePt?: boolean;
	}

	export default function SVGtoPDF(
		document: unknown,
		svg: string,
		x: number,
		y: number,
		options?: SvgToPdfOptions
	): void;
}
