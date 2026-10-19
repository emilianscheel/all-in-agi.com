<script lang="ts">
	import {
		createColumnHelper,
		createTable,
		renderComponent,
		tableFeatures
	} from '@tanstack/svelte-table';
	import type { Locale } from '$lib/i18n';
	import type { UserTableRow } from './booking-types';
	import DataTable from './data-table.svelte';
	import UserNameCell from './user-name-cell.svelte';
	import UserPasskeyCell from './user-passkey-cell.svelte';
	import UsersRowActions from './users-row-actions.svelte';

	export type { UserTableRow };

	let {
		users,
		locale,
		currentUserId,
		deleteBusyId,
		onConfirmDelete
	}: {
		users: UserTableRow[];
		locale: Locale;
		currentUserId: string;
		deleteBusyId: string | null;
		onConfirmDelete: (adminUser: UserTableRow) => void;
	} = $props();

	const features = tableFeatures({});
	const columnHelper = createColumnHelper<typeof features, UserTableRow>();

	function formatDate(value: string | Date) {
		return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-DE', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: 'Europe/Berlin'
		}).format(new Date(value));
	}

	const columns = $derived(
		columnHelper.columns([
			columnHelper.accessor('name', {
				header: () => 'Name',
				cell: ({ row }) =>
					renderComponent(UserNameCell, {
						name: row.original.name,
						id: row.original.id
					})
			}),
			columnHelper.accessor('email', {
				header: () => 'E-Mail'
			}),
			columnHelper.accessor('hasPasskey', {
				header: () => 'Passkey',
				cell: ({ row }) =>
					renderComponent(UserPasskeyCell, {
						hasPasskey: row.original.hasPasskey,
						locale
					})
			}),
			columnHelper.accessor('createdAt', {
				header: () => (locale === 'en' ? 'Created' : 'Erstellt'),
				cell: ({ getValue }) => formatDate(getValue())
			}),
			columnHelper.display({
				id: 'actions',
				header: () => '',
				cell: ({ row }) =>
					renderComponent(UsersRowActions, {
						adminUser: row.original,
						locale,
						deleteBusyId,
						currentUserId,
						userCount: users.length,
						onConfirmDelete
					})
			})
		])
	);

	const table = createTable({
		features,
		get columns() {
			return columns;
		},
		get data() {
			return users;
		},
		getRowId: (row) => row.id
	});
</script>

<DataTable
	{table}
	columnCount={columns.length}
	emptyMessage={locale === 'en' ? 'No users yet.' : 'Noch keine Nutzer vorhanden.'}
/>
