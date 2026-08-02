import { describe, expect, test } from 'bun:test';
import { calculateCancellationCharge } from './cancellation';

describe('B2B cancellation calculation', () => {
	test('uses the package matrix and device supplement through 14 days before the event', () => {
		const result = calculateCancellationCharge({ capacity: 30, organizerDevices: true, contractNetEuros: 6500, eventStart: new Date('2026-09-30T07:00:00Z'), cancelledAt: new Date('2026-09-16T07:00:00Z') });
		expect(result).toMatchObject({ regime: 'flat-rate', standardChargeCents: 200000, chargeCents: 200000, lowerDamageProofPermitted: true });
	});

	test('deducts savings and alternative revenue for a late cancellation', () => {
		const result = calculateCancellationCharge({ capacity: 15, organizerDevices: false, contractNetEuros: 4000, eventStart: new Date('2026-09-30T07:00:00Z'), cancelledAt: new Date('2026-09-20T07:00:00Z'), savedExpensesEuros: 600, alternativeRevenueEuros: 400 });
		expect(result).toMatchObject({ regime: 'late-cancellation', standardChargeCents: 300000, chargeCents: 300000 });
	});

	test('applies documented lower-damage proof', () => {
		const result = calculateCancellationCharge({ capacity: 50, organizerDevices: true, contractNetEuros: 8000, eventStart: new Date('2026-09-30T07:00:00Z'), cancelledAt: new Date('2026-08-01T07:00:00Z'), provenLowerDamageEuros: 250 });
		expect(result.chargeCents).toBe(25000);
	});
});

