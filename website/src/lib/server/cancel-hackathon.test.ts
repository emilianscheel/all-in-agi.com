import { describe, expect, test } from 'bun:test';
import { cancelHackathonBooking, type CancellationDependencies } from './cancel-hackathon';
import type { HackathonRecord } from './hackathons';

function cancellationRecord(): HackathonRecord {
	return {
		id: 'HAA-AAA-AAA', status: 'confirmed', companyName: 'Musterwerke', contactName: 'Ada', contactEmail: 'ada@example.com', contactPhone: '', message: '',
		capacity: 15, venueProvided: true, equipment: 'projector', lunch: 'pizza', customLunch: '', toolProvision: 'existing', codingTools: ['codex'], customCodingTool: '',
		address: { label: '', street: 'Teststraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland' },
		eventStart: '2099-06-20T07:00:00.000Z', eventEnd: '2099-06-20T15:00:00.000Z', consultationSlot: '2099-05-10T10:00:00.000Z',
		basePrice: 4000, venueSurcharge: 0, lunchAdjustment: 0, toolsAdjustment: 0, totalPrice: 4000,
		prepCallBookingUid: 'prep-1', prepCallBookingIcsUid: null, prepCallBookingTitle: null, prepCallBookingStart: null, prepCallBookingEnd: null, prepCallMeetingUrl: null,
		hackathonBookingUid: 'event-1', hackathonBookingIcsUid: null, hackathonBookingTitle: null, hackathonBookingStart: null, hackathonBookingEnd: null,
		hackathonCancelledAt: null, prepCallCancelledAt: null, cancelledAt: null, cancellationEmailSentAt: null, cancellationEmailMessageId: null, cancellationProcessingAt: null,
		invoiceSnapshot: null, invoiceIssuedAt: null, invoiceEmailSentAt: null, invoiceEmailMessageId: null,
		demoMode: false, createdAt: '2099-01-01T00:00:00.000Z', updatedAt: '2099-01-01T00:00:00.000Z'
	};
}

function harness(record = cancellationRecord()) {
	const log: string[] = [];
	const dependencies: CancellationDependencies = {
		claim: async () => {
			if (record.status === 'confirmed') record.status = 'cancellation_pending';
			return { claimed: true, record };
		},
		getRecord: async () => record,
		markCalendar: async (_id, kind) => {
			log.push(`mark:${kind}`);
			if (kind === 'hackathon') record.hackathonCancelledAt = new Date().toISOString();
			else record.prepCallCancelledAt = new Date().toISOString();
			return record;
		},
		markCancelled: async () => { log.push('mark:cancelled'); record.status = 'cancelled'; record.cancelledAt = new Date().toISOString(); return record; },
		markEmail: async (_id, messageId) => { log.push(`mark:email:${messageId}`); record.cancellationEmailSentAt = new Date().toISOString(); return record; },
		release: async () => { log.push('release'); },
		cancelCalendar: async (booking) => { log.push(`cancel:${booking.uid}`); },
		sendEmail: async () => { log.push('email'); return { messageId: 'mail-1', status: 'queued' as const }; }
	};
	return { record, log, dependencies };
}

describe('hackathon cancellation orchestration', () => {
	test('cancels both calendar events before notifying the customer', async () => {
		const { log, dependencies } = harness();
		const result = await cancelHackathonBooking('HAA-AAA-AAA', fetch, dependencies);
		expect(result.found && result.state.complete).toBe(true);
		expect(log).toEqual(['cancel:event-1', 'mark:hackathon', 'cancel:prep-1', 'mark:prep-call', 'mark:cancelled', 'email', 'mark:email:mail-1', 'release']);
	});

	test('persists the first calendar step and retries only missing work', async () => {
		const { record, log, dependencies } = harness();
		let prepAttempts = 0;
		dependencies.cancelCalendar = async (booking) => {
			log.push(`cancel:${booking.uid}`);
			if (booking.uid === 'prep-1' && prepAttempts++ === 0) throw new Error('Cal unavailable');
		};
		const first = await cancelHackathonBooking(record.id, fetch, dependencies);
		expect(first.found && first.state.complete).toBe(false);
		const second = await cancelHackathonBooking(record.id, fetch, dependencies);
		expect(second.found && second.state.complete).toBe(true);
		expect(log.filter((entry) => entry === 'cancel:event-1')).toHaveLength(1);
		expect(log.filter((entry) => entry === 'cancel:prep-1')).toHaveLength(2);
	});

	test('retries a failed email without repeating calendar cancellations', async () => {
		const { record, log, dependencies } = harness();
		let emailAttempts = 0;
		dependencies.sendEmail = async () => {
			log.push('email');
			if (emailAttempts++ === 0) throw new Error('Email unavailable');
			return { messageId: 'mail-2', status: 'accepted' as const };
		};
		await cancelHackathonBooking(record.id, fetch, dependencies);
		const second = await cancelHackathonBooking(record.id, fetch, dependencies);
		expect(second.found && second.state.complete).toBe(true);
		expect(log.filter((entry) => entry.startsWith('cancel:'))).toHaveLength(2);
		expect(log.filter((entry) => entry === 'email')).toHaveLength(2);
	});

	test('does not duplicate work while another request owns the lease', async () => {
		const { record, log, dependencies } = harness();
		record.status = 'cancellation_pending';
		dependencies.claim = async () => ({ claimed: false, record });
		const result = await cancelHackathonBooking(record.id, fetch, dependencies);
		expect(result.found && result.state.processing).toBe(true);
		expect(log).toEqual([]);
	});
});
