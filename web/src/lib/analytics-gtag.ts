/** Google's tag only runs dataLayer commands stored as Arguments objects, not arrays. */
function queueGtagCommand(dataLayer: unknown[], command: IArguments) {
	dataLayer.push(command);
}

export function createGtagStub(dataLayer: unknown[]) {
	return function gtag() {
		queueGtagCommand(dataLayer, arguments);
	};
}
