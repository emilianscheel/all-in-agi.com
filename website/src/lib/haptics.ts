const INTERACTIVE_SELECTOR = [
	'a[href]',
	'button',
	'label.choice',
	'label.coding-tool-option',
	'input[type="checkbox"]',
	'input[type="radio"]',
	'[data-calendar-day]'
].join(',');

function triggerVirtualHapticSwitch() {
	const label = document.createElement('label');
	const input = document.createElement('input');

	input.type = 'checkbox';
	input.setAttribute('switch', '');
	input.tabIndex = -1;
	input.setAttribute('aria-hidden', 'true');
	label.setAttribute('aria-hidden', 'true');
	label.style.display = 'none';
	label.append(input);
	document.head.append(label);
	label.click();
	label.remove();
}

export function installGlobalHaptics() {
	function haptic() {
		try {
			if (typeof navigator.vibrate === 'function' && navigator.vibrate(10)) return;
			// Safari on iPhone has no Vibration API, but its native switch control
			// produces haptic feedback when its wrapping label is activated.
			triggerVirtualHapticSwitch();
		} catch {
			// Haptics are progressive enhancement and may be blocked by the browser or OS.
		}
	}

	function onPointerUp(event: PointerEvent) {
		if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
		const target = event.target instanceof Element ? event.target.closest<HTMLElement>(INTERACTIVE_SELECTOR) : null;
		if (!target) return;
		if (target.matches(':disabled,[aria-disabled="true"]') || target.closest(':disabled,[aria-disabled="true"]')) return;
		haptic();
	}

	document.addEventListener('pointerup', onPointerUp, { capture: true, passive: true });
	return () => {
		document.removeEventListener('pointerup', onPointerUp, { capture: true });
	};
}
