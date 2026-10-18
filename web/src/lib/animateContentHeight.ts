import { animate, type AnimationPlaybackControls } from 'motion';

/** Animate a container to the natural height of its first child. */
export function animateContentHeight(container: HTMLElement) {
	const content = container.firstElementChild;
	if (!(content instanceof HTMLElement)) return;
	const measuredContent = content;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	let animation: AnimationPlaybackControls | undefined;
	let initialized = false;
	let targetHeight = 0;

	function updateHeight() {
		const style = getComputedStyle(container);
		const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
		const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
		const nextHeight = measuredContent.getBoundingClientRect().height + border + padding;
		if (!Number.isFinite(nextHeight) || nextHeight === targetHeight) return;

		const currentHeight = container.getBoundingClientRect().height;
		animation?.stop();
		targetHeight = nextHeight;
		if (!initialized || reducedMotion.matches || Math.abs(currentHeight - nextHeight) < 1) {
			container.style.height = `${nextHeight}px`;
			initialized = true;
			return;
		}

		animation = animate(container, { height: [`${currentHeight}px`, `${nextHeight}px`] }, {
			duration: 0.3,
			ease: [0.22, 1, 0.36, 1]
		});
	}

	const observer = new ResizeObserver(updateHeight);
	observer.observe(measuredContent);
	function onMotionPreferenceChange() {
		if (reducedMotion.matches) {
			animation?.stop();
			container.style.height = `${targetHeight}px`;
		}
	}
	reducedMotion.addEventListener('change', onMotionPreferenceChange);

	return {
		destroy() {
		observer.disconnect();
		reducedMotion.removeEventListener('change', onMotionPreferenceChange);
		animation?.stop();
	}
	};
}
