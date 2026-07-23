import { CODING_TOOLS, type BookingConfiguration } from './booking';

export interface SharedPlanV1 extends Omit<BookingConfiguration, 'lunch' | 'toolProvision' | 'codingTools' | 'customCodingTool'> {
	v: 1;
	lunch: 'pizza' | 'custom' | 'none';
	consultationMode: 'quick' | 'custom';
	customConsultationDate: string;
}

export interface SharedPlanV2 extends BookingConfiguration {
	v: 2;
	consultationMode: 'quick' | 'custom';
	customConsultationDate: string;
}

export type SharedPlan = SharedPlanV1 | SharedPlanV2;

export function isSharedPlan(value: unknown): value is SharedPlan {
	if (!value || typeof value !== 'object') return false;
	const plan = value as Omit<Partial<SharedPlanV2>, 'v'> & { v?: number };
	const address = plan.address as Record<string, unknown> | undefined;
	const strings = ['companyName', 'contactName', 'email', 'phone', 'customLunch', 'preferredEventDate', 'consultationSlot', 'customConsultationDate'];
	if (plan.v === 2) strings.push('customCodingTool');
	const stringsWithinLimit = strings
		.every((key) => typeof plan[key as keyof SharedPlanV2] === 'string' && String(plan[key as keyof SharedPlanV2]).length <= 500);
	const validAddress = Boolean(address)
		&& ['label', 'street', 'postalCode', 'city'].every((key) => typeof address?.[key] === 'string' && String(address[key]).length <= 500)
		&& address?.country === 'Deutschland'
		&& (address.latitude === undefined || (typeof address.latitude === 'number' && Number.isFinite(address.latitude)))
		&& (address.longitude === undefined || (typeof address.longitude === 'number' && Number.isFinite(address.longitude)));
	const validCommon = [1, 2].includes(plan.v as number)
		&& [15, 30, 50].includes(plan.capacity as number)
		&& typeof plan.venueProvided === 'boolean'
		&& ['projector', 'tv', 'none'].includes(plan.equipment ?? '')
		&& ['quick', 'custom'].includes(plan.consultationMode ?? '')
		&& validAddress
		&& stringsWithinLimit;
	if (!validCommon) return false;
	if (plan.v === 1) return ['pizza', 'custom', 'none'].includes(plan.lunch ?? '');
	const validToolIds = new Set(CODING_TOOLS.map(({ id }) => id));
	return ['pizza', 'custom', 'none', 'self-organized'].includes(plan.lunch ?? '')
		&& (plan.toolProvision === null || ['existing', 'needed'].includes(plan.toolProvision ?? ''))
		&& Array.isArray(plan.codingTools)
		&& plan.codingTools.every((tool) => validToolIds.has(tool));
}

export function toSharedPlanV2(plan: SharedPlan): SharedPlanV2 {
	if (plan.v === 2) return plan;
	return {
		...plan,
		v: 2,
		toolProvision: null,
		codingTools: [],
		customCodingTool: ''
	};
}
