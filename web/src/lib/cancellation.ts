import type { Capacity } from './booking';

export interface CancellationChargeSnapshot {
	version: 1;
	calculatedAt: string;
	regime: 'flat-rate' | 'late-cancellation';
	capacity: Capacity;
	deviceSupplementCents: number;
	contractNetCents: number;
	savedExpensesCents: number;
	alternativeRevenueCents: number;
	standardChargeCents: number;
	chargeCents: number;
	reviewRequired: true;
	lowerDamageProofPermitted: true;
}

const FLAT_CANCELLATION_EUROS: Record<Capacity, number> = { 15: 1000, 30: 1500, 50: 2000 };

export function calculateCancellationCharge(input: {
	capacity: Capacity;
	organizerDevices: boolean;
	contractNetEuros: number;
	eventStart: Date;
	cancelledAt: Date;
	savedExpensesEuros?: number;
	alternativeRevenueEuros?: number;
	provenLowerDamageEuros?: number;
}): CancellationChargeSnapshot {
	const savedExpensesCents = Math.max(0, Math.round((input.savedExpensesEuros ?? 0) * 100));
	const alternativeRevenueCents = Math.max(0, Math.round((input.alternativeRevenueEuros ?? 0) * 100));
	const contractNetCents = Math.max(0, Math.round(input.contractNetEuros * 100));
	const fourteenDaysBefore = input.eventStart.getTime() - 14 * 86_400_000;
	const flatRate = input.cancelledAt.getTime() <= fourteenDaysBefore;
	const deviceSupplementCents = flatRate && input.organizerDevices ? 50_000 : 0;
	const standardChargeCents = flatRate
		? FLAT_CANCELLATION_EUROS[input.capacity] * 100 + deviceSupplementCents
		: Math.max(0, contractNetCents - savedExpensesCents - alternativeRevenueCents);
	const provenLower = input.provenLowerDamageEuros === undefined ? standardChargeCents : Math.max(0, Math.round(input.provenLowerDamageEuros * 100));
	return {
		version: 1,
		calculatedAt: input.cancelledAt.toISOString(),
		regime: flatRate ? 'flat-rate' : 'late-cancellation',
		capacity: input.capacity,
		deviceSupplementCents,
		contractNetCents,
		savedExpensesCents,
		alternativeRevenueCents,
		standardChargeCents,
		chargeCents: Math.min(standardChargeCents, provenLower),
		reviewRequired: true,
		lowerDamageProofPermitted: true
	};
}

