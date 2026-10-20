<script lang="ts">
	import {
		Ban,
		CalendarPlus,
		Clock,
		Download,
		Ellipsis,
		ExternalLink,
		Eye,
		Handshake,
		Mail,
		RotateCcw,
		Share
	} from 'lucide-svelte';
	import { effectiveBillingDetails, validateBillingDetails } from '$lib/booking';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { Locale } from '$lib/i18n';
	import type { BookingTableRow } from './booking-types';

	let {
		booking,
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
		booking: BookingTableRow;
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

	let canTimerClock = $derived(booking.status === 'contracted' || booking.status === 'confirmed');
	let isEditable = $derived(booking.status === 'prep_scheduled' || booking.status === 'confirmed');
	let canContractFlow = $derived(booking.status === 'prep_scheduled');
	let billingComplete = $derived(validateBillingDetails(effectiveBillingDetails({
		billing: booking.billing,
		companyName: booking.companyName,
		contactName: booking.contactName,
		contactEmail: booking.contactEmail,
		address: booking.address
	}), locale).length === 0);
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
	<DropdownMenu.Content class="min-w-[280px]" align="end" sideOffset={6}>
		<DropdownMenu.Item onSelect={() => onOpenDetails(booking.id)}>
			<Eye size={16} aria-hidden="true" />
			{locale === 'en' ? 'Open details' : 'Details öffnen'}
		</DropdownMenu.Item>

		<DropdownMenu.Separator />

		<DropdownMenu.Item onSelect={() => onShare(booking)}>
			<Share size={16} aria-hidden="true" />
			{locale === 'en' ? 'Share hackathon' : 'Hackathon teilen'}
		</DropdownMenu.Item>
		<DropdownMenu.Item onSelect={() => onDownloadPlan(booking)}>
			<Download size={16} aria-hidden="true" />
			{locale === 'en' ? 'Download plan' : 'Plan herunterladen'}
		</DropdownMenu.Item>
		{#if isEditable}
			<DropdownMenu.Item onSelect={() => onAddCalendar(booking)}>
				<CalendarPlus size={16} aria-hidden="true" />
				{locale === 'en' ? 'Add calendar event' : 'Kalenderereignis hinzufügen'}
			</DropdownMenu.Item>
			<DropdownMenu.Item
				disabled={confirmationBusyId !== null}
				onSelect={() => onSendConfirmation(booking)}
			>
				<Mail size={16} aria-hidden="true" />
				{#if confirmationBusyId === booking.id}
					{locale === 'en' ? 'Sending email …' : 'E-Mail wird gesendet …'}
				{:else}
					{locale === 'en' ? 'Send confirmation email' : 'Bestätigungs-E-Mail senden'}
				{/if}
			</DropdownMenu.Item>
		{/if}

		{#if canContractFlow}
			<DropdownMenu.Separator />
			<DropdownMenu.Item onSelect={() => onOpenAgreementTest(booking)}>
				<Mail size={16} aria-hidden="true" />
				{locale === 'en' ? 'Send contract email as test to me' : 'Vertrags-E-Mail als Test an mich senden'}
			</DropdownMenu.Item>
			<DropdownMenu.Item
				disabled={!billingComplete}
				onSelect={() => onOpenAgreementRecord(booking)}
			>
				<Handshake size={16} aria-hidden="true" />
				{locale === 'en' ? 'Document mutual agreement' : 'Beiderseitige Zustimmung dokumentieren'}
			</DropdownMenu.Item>
		{/if}

		{#if canTimerClock}
			<DropdownMenu.Separator />
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
