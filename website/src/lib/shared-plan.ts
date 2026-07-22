import type { BookingConfiguration } from './booking';

export interface SharedPlanV1 extends BookingConfiguration {
	v: 1;
	consultationMode: 'quick' | 'custom';
	customConsultationDate: string;
}

export function isSharedPlan(value: unknown): value is SharedPlanV1 {
	if (!value || typeof value !== 'object') return false;
	const plan = value as Partial<SharedPlanV1>;
	const address = plan.address as Record<string, unknown> | undefined;
	const stringsWithinLimit = ['companyName', 'contactName', 'email', 'phone', 'customLunch', 'preferredEventDate', 'consultationSlot', 'customConsultationDate']
		.every((key) => typeof plan[key as keyof SharedPlanV1] === 'string' && String(plan[key as keyof SharedPlanV1]).length <= 500);
	const validAddress = Boolean(address)
		&& ['label', 'street', 'postalCode', 'city'].every((key) => typeof address?.[key] === 'string' && String(address[key]).length <= 500)
		&& address?.country === 'Deutschland'
		&& (address.latitude === undefined || (typeof address.latitude === 'number' && Number.isFinite(address.latitude)))
		&& (address.longitude === undefined || (typeof address.longitude === 'number' && Number.isFinite(address.longitude)));
	return plan.v === 1
		&& [15, 30, 50].includes(plan.capacity as number)
		&& typeof plan.venueProvided === 'boolean'
		&& ['projector', 'tv', 'none'].includes(plan.equipment ?? '')
		&& ['pizza', 'custom', 'none'].includes(plan.lunch ?? '')
		&& ['quick', 'custom'].includes(plan.consultationMode ?? '')
		&& validAddress
		&& stringsWithinLimit;
}
