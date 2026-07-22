import { animate, stagger } from 'motion';

type RevealOptions = {
	delay?: number;
	group?: boolean;
};

export function reveal(node: HTMLElement, options: RevealOptions = {}) {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return {};

	const targets = options.group ? Array.from(node.children) as HTMLElement[] : [node];
	for (const target of targets) {
		target.style.opacity = '0';
		target.style.transform = 'translateY(26px)';
	}

	let controls: ReturnType<typeof animate> | undefined;
	const observer = new IntersectionObserver(
		([entry]) => {
			if (!entry.isIntersecting) return;
			controls = animate(
				targets,
				{ opacity: [0, 1], y: [26, 0] },
				{
					duration: 0.72,
					delay: options.group ? stagger(0.07, { startDelay: options.delay ?? 0 }) : options.delay ?? 0,
					ease: [0.22, 1, 0.36, 1]
				}
			);
			observer.disconnect();
		},
		{ rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
			controls?.stop();
		}
	};
}
