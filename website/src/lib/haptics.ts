const INTERACTIVE_SELECTOR = [
	'a[href]',
	'button',
	'label.choice',
	'label.coding-tool-option',
	'input[type="checkbox"]',
	'input[type="radio"]',
	'[data-calendar-day]'
].join(',');

function createIosHapticSwitch() {
	const wrapper = document.createElement('span');
	const input = document.createElement('input');
	const label = document.createElement('label');
	const id = `werksprung-haptic-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

	input.id = id;
	input.type = 'checkbox';
	input.setAttribute('switch', '');
	input.tabIndex = -1;
	input.setAttribute('aria-hidden', 'true');
	label.htmlFor = id;
	wrapper.setAttribute('aria-hidden', 'true');
	Object.assign(wrapper.style, {
		position: 'fixed',
		left: '-10000px',
		top: '0',
		width: '1px',
		height: '1px',
		overflow: 'hidden',
		opacity: '0',
		pointerEvents: 'none'
	});
	wrapper.append(input, label);
	document.body.append(wrapper);
	return { wrapper, label };
}

export function installGlobalHaptics() {
	const iosSwitch = createIosHapticSwitch();

	function haptic() {
		try {
			if (typeof navigator.vibrate === 'function') {
				navigator.vibrate(10);
				return;
			}
			iosSwitch.label.click();
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
		iosSwitch.wrapper.remove();
	};
}
