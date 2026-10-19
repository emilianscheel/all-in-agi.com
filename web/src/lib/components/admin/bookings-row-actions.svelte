<script lang="ts">
	import { Ban, Clock, Ellipsis, ExternalLink, Eye, RotateCcw } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { Locale } from '$lib/i18n';
	import type { BookingTableRow } from './booking-types';

	let {
		booking,
		locale,
		cancellationBusyId,
		onOpenDetails,
		onOpenTimer,
		onOpenClock,
		onConfirmCancellation,
		onCancelBooking
	}: {
		booking: BookingTableRow;
		locale: Locale;
		cancellationBusyId: string | null;
		onOpenDetails: (id: string) => void;
		onOpenTimer: (id: string) => void;
		onOpenClock: () => void;
		onConfirmCancellation: (booking: BookingTableRow) => void;
		onCancelBooking: (booking: BookingTableRow) => void;
	} = $props();

	let canTimerClock = $derived(booking.status === 'contracted' || booking.status === 'confirmed');
	let canEarlyCancel = $derived(
		['requested', 'prep_scheduled', 'cancellation_pending', 'cancelled'].includes(booking.status) &&
			!booking.cancellationEmailSentAt
	);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				size="icon"
				class="dashboard-action-trigger size-[34px] rounded-full"
				aria-label={`${locale === 'en' ? 'Actions for' : 'Aktionen für'} ${booking.companyName}`}
			>
				<Ellipsis size={19} aria-hidden="true" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="min-w-[220px]" align="end" sideOffset={6}>
		<DropdownMenu.Item onSelect={() => onOpenDetails(booking.id)}>
			<Eye size={16} aria-hidden="true" />
			{locale === 'en' ? 'Open details' : 'Details öffnen'}
		</DropdownMenu.Item>
		{#if canTimerClock}
			{#if booking.eventStart && booking.eventEnd}
				<DropdownMenu.Item onSelect={() => onOpenTimer(booking.id)}>
					<ExternalLink size={16} aria-hidden="true" />
					{locale === 'en' ? 'Open timer' : 'Timer öffnen'}
				</DropdownMenu.Item>
			{/if}
			<DropdownMenu.Item onSelect={onOpenClock}>
				<Clock size={16} aria-hidden="true" />
				{locale === 'en' ? 'Open clock' : 'Clock öffnen'}
			</DropdownMenu.Item>
			{#if booking.eventStart && booking.eventEnd}
				<DropdownMenu.Separator />
				<DropdownMenu.Item disabled={cancellationBusyId !== null} onSelect={() => onConfirmCancellation(booking)}>
					<Ban size={16} aria-hidden="true" />
					{locale === 'en' ? 'Cancel booking' : 'Buchung stornieren'}
				</DropdownMenu.Item>
			{/if}
		{:else if canEarlyCancel}
			<DropdownMenu.Separator />
			<DropdownMenu.Item disabled={cancellationBusyId !== null} onSelect={() => onCancelBooking(booking)}>
				<RotateCcw size={16} aria-hidden="true" />
				{#if cancellationBusyId === booking.id}
					{locale === 'en' ? 'Working …' : 'Wird bearbeitet …'}
				{:else if booking.status === 'cancelled'}
					{locale === 'en' ? 'Resend email' : 'E-Mail erneut senden'}
				{:else if booking.status === 'cancellation_pending'}
					{locale === 'en' ? 'Continue cancellation' : 'Stornierung fortsetzen'}
				{:else}
					{locale === 'en' ? 'Cancel booking' : 'Buchung stornieren'}
				{/if}
			</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
