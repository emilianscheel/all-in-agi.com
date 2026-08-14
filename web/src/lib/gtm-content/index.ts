import type { EditorialPageContent } from '$lib/gtm-pages';
import { toolPages } from './tools';
import { societyPages } from './society';
import { industryPages } from './industries';
import { mittelstandPages } from './mittelstand';

export const editorialPageContent: EditorialPageContent[] = [
	...toolPages,
	...societyPages,
	...industryPages,
	...mittelstandPages
];
