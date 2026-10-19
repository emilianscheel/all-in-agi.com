function escapeHtml(text: string): string {
	return text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function isSafeHttpUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}

function linkTag(href: string, label: string): string {
	return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

/**
 * Escape plain FAQ answer text, then autolink markdown links, URLs, emails, and phones.
 */
export function linkifyFaqAnswer(text: string): string {
	const escaped = escapeHtml(text);

	// Placeholders protect already-linked spans from later regex passes.
	const parts: string[] = [];
	const protect = (html: string) => {
		const index = parts.length;
		parts.push(html);
		return `\u0000${index}\u0000`;
	};

	let result = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, label, url) => {
		if (!isSafeHttpUrl(url)) return escapeHtml(`[${label}](${url})`);
		return protect(linkTag(url, label));
	});

	result = result.replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)]/g, (url) => {
		if (!isSafeHttpUrl(url)) return url;
		return protect(linkTag(url, url));
	});

	result = result.replace(
		/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
		(email) => protect(linkTag(`mailto:${email}`, email))
	);

	// International-ish phone numbers (+49 152 57257750, +1-555-0100, etc.)
	result = result.replace(
		/(?<![\w@])(\+\d{1,3}(?:[\s.-]?\d){6,14}\d)/g,
		(phone) => {
			const href = `tel:${phone.replace(/[^\d+]/g, '')}`;
			return protect(linkTag(href, phone));
		}
	);

	return result.replace(/\u0000(\d+)\u0000/g, (_match, index) => parts[Number(index)] ?? '');
}
