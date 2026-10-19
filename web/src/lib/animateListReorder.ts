import { animate, type AnimationPlaybackControls } from 'motion';

const EASE = [0.22, 1, 0.36, 1] as const;

/** bits-ui Command.Item wraps options in `display: contents`; animate the visible option. */
function visualTarget(wrapper: HTMLElement) {
	const option = wrapper.querySelector<HTMLElement>('[role="option"], .cmdk-item');
	return option ?? wrapper;
}

function entryId(wrapper: HTMLElement) {
	return (
		wrapper.getAttribute('data-value') ||
		wrapper.dataset.flipId ||
		visualTarget(wrapper).getAttribute('data-value') ||
		visualTarget(wrapper).dataset.flipId ||
		''
	);
}

function measureChildren(node: HTMLElement) {
	const next = new Map<string, DOMRect>();
	for (const child of Array.from(node.children)) {
		if (!(child instanceof HTMLElement)) continue;
		if (child.hasAttribute('data-flip-ignore')) continue;
		const id = entryId(child);
		if (!id) continue;
		const target = visualTarget(child);
		if (target.hidden || getComputedStyle(target).display === 'none') continue;
		const rect = target.getBoundingClientRect();
		if (rect.width === 0 && rect.height === 0) continue;
		next.set(id, rect);
	}
	return next;
}

/**
 * FLIP-animate list entries when a keyed list reorders.
 * Call `capture()` before the DOM update and `play()` after.
 */
function prefersReducedMotion() {
	return (
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

export function createListReorderAnimator() {
	let node: HTMLElement | null = null;
	let previous = new Map<string, DOMRect>();
	let animations: AnimationPlaybackControls[] = [];

	function stopRunning() {
		for (const animation of animations) animation.stop();
		animations = [];
	}

	return {
		attach(el: HTMLElement | null) {
			if (node === el) return;
			node = el;
			previous = el ? measureChildren(el) : new Map();
		},
		capture() {
			if (!node) return;
			previous = measureChildren(node);
		},
		play() {
			if (!node) return;
			if (prefersReducedMotion()) {
				previous = measureChildren(node);
				return;
			}

			const last = measureChildren(node);
			if (previous.size === 0) {
				previous = last;
				return;
			}

			stopRunning();

			for (const child of Array.from(node.children)) {
				if (!(child instanceof HTMLElement)) continue;
				if (child.hasAttribute('data-flip-ignore')) continue;
				const id = entryId(child);
				if (!id) continue;
				const target = visualTarget(child);
				const lastRect = last.get(id);
				const firstRect = previous.get(id);
				if (!lastRect) continue;

				if (!firstRect) {
					animations.push(
						animate(
							target,
							{ opacity: [0, 1], transform: ['translateY(8px)', 'translateY(0px)'] },
							{ duration: 0.2, ease: EASE }
						)
					);
					continue;
				}

				const dx = firstRect.left - lastRect.left;
				const dy = firstRect.top - lastRect.top;
				if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;

				animations.push(
					animate(
						target,
						{
							transform: [`translate(${dx}px, ${dy}px)`, 'translate(0px, 0px)']
						},
						{ duration: 0.28, ease: EASE }
					)
				);
			}

			previous = last;
		},
		destroy() {
			stopRunning();
			node = null;
			previous = new Map();
		}
	};
}
