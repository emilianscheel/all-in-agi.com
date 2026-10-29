import { slidesFromDocuments } from './parse';

const documents = import.meta.glob('./*.txt', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

/** Built from the .txt files in this folder. Edit those files to change a slide. */
export const slides = slidesFromDocuments(documents);
