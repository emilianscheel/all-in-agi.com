<script lang="ts">
	import {
		createColumnHelper,
		createTable,
		renderComponent,
		tableFeatures
	} from '@tanstack/svelte-table';
	import { formatPrice } from '$lib/booking';
	import type { Locale } from '$lib/i18n';
	import type { BookingTableRow } from './booking-types';
	import BookingHackathonCell from './booking-hackathon-cell.svelte';
	import BookingStatusCell from './booking-status-cell.svelte';
	import BookingsRowActions from './bookings-row-actions.svelte';
	import DataTable from './data-table.svelte';

	export type { BookingTableRow };

	let {
		bookings,
		locale,
		cancellationBusyId,
		confirmationBusyId,
		onOpenDetails,
		onOpenTimer,
		onOpenClock,
		onShare,
		onDownloadPlan,
		onAddCalendar,
		onSendConfirmation,
		onOpenAgreementTest,
		onOpenAgreementRecord,
		onConfirmCancellation,
		onCancelBooking
	}: {
		bookings: BookingTableRow[];
		locale: Locale;
		cancellationBusyId: string | null;
		confirmationBusyId: string | null;
		onOpenDetails: (id: string) => void;
		onOpenTimer: (id: string) => void;
		onOpenClock: () => void;
		onShare: (booking: BookingTableRow) => void;
		onDownloadPlan: (booking: BookingTableRow) => void;
		onAddCalendar: (booking: BookingTableRow) => void;
		onSendConfirmation: (booking: BookingTableRow) => void;
		onOpenAgreementTest: (booking: BookingTableRow) => void;
		onOpenAgreementRecord: (booking: BookingTableRow) => void;
		onConfirmCancellation: (booking: BookingTableRow) => void;
		onCancelBooking: (booking: BookingTableRow) => void;
	} = $props();

	const features = tableFeatures({});
	const columnHelper = createColumnHelper<typeof features, BookingTableRow>();

	function formatDate(value: string | null) {
		if (!value) return locale === 'en' ? 'Set later' : 'Später festlegen';
		return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-DE', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: 'Europe/Berlin'
		}).format(new Date(value));
	}

	function statusLabel(status: string) {
		if (status === 'requested') return locale === 'en' ? 'Requested' : 'Angefragt';
		if (status === 'prep_scheduled')
			return locale === 'en' ? 'Preparation call scheduled' : 'Preparation Call geplant';
		if (status === 'exit_window') return locale === 'en' ? 'Exit window' : 'Lösungsfrist';
		if (status === 'contracted' || status === 'confirmed') return locale === 'en' ? 'Contracted' : 'Vertraglich';
		if (status === 'completed') return locale === 'en' ? 'Completed' : 'Durchgeführt';
		if (status === 'withdrawn') return locale === 'en' ? 'Withdrawn' : 'Zurückgetreten';
		if (status === 'declined') return locale === 'en' ? 'Declined' : 'Abgelehnt';
		if (status === 'cancellation_pending') return locale === 'en' ? 'Cancellation pending' : 'Stornierung offen';
		return locale === 'en' ? 'Cancelled' : 'Storniert';
	}

	const columns = $derived(
		columnHelper.columns([
			columnHelper.accessor('status', {
				header: () => (locale === 'en' ? 'Status' : 'Status'),
				cell: ({ row }) =>
					renderComponent(BookingStatusCell, {
						status: row.original.status,
						label: statusLabel(row.original.status)
					})
			}),
			columnHelper.accessor('companyName', {
				header: () => 'Hackathon',
				cell: ({ row }) =>
					renderComponent(BookingHackathonCell, {
						id: row.original.id,
						companyName: row.original.companyName,
						contactName: row.original.contactName,
						contactEmail: row.original.contactEmail
					})
			}),
			columnHelper.accessor('eventStart', {
				header: () => (locale === 'en' ? 'Event' : 'Termin'),
				cell: ({ getValue }) => formatDate(getValue())
			}),
			columnHelper.accessor('capacity', {
				header: () => 'Team',
				cell: ({ getValue }) =>
					locale === 'en' ? `Up to ${getValue()}` : `Bis ${getValue()}`
			}),
			columnHelper.accessor('totalPrice', {
				header: () => (locale === 'en' ? 'Net' : 'Netto'),
				cell: ({ getValue }) => formatPrice(getValue())
			}),
			columnHelper.accessor('createdAt', {
				header: () => (locale === 'en' ? 'Requested on' : 'Angefragt am'),
				cell: ({ getValue }) => formatDate(getValue())
			}),
			columnHelper.display({
				id: 'actions',
				header: () => '',
				cell: ({ row }) =>
					renderComponent(BookingsRowActions, {
						booking: row.original,
						locale,
						cancellationBusyId,
						confirmationBusyId,
						onOpenDetails,
						onOpenTimer,
						onOpenClock,
						onShare,
						onDownloadPlan,
						onAddCalendar,
						onSendConfirmation,
						onOpenAgreementTest,
						onOpenAgreementRecord,
						onConfirmCancellation,
						onCancelBooking
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
			return bookings;
		},
		getRowId: (row) => row.id
	});
</script>

<DataTable
	{table}
	columnCount={columns.length}
	emptyMessage={locale === 'en' ? 'No customer bookings yet.' : 'Noch keine Kundenbuchungen vorhanden.'}
/>
