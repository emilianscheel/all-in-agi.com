import { CODING_TOOLS, type BookingConfiguration } from './booking';
import { eventTimesForDate } from './event-time';

type ShareableBookingConfiguration = Omit<BookingConfiguration, 'billing' | 'businessCustomerConfirmed' | 'authorityConfirmed'>;

interface LegacyBookingConfiguration extends Omit<ShareableBookingConfiguration, 'eventStart' | 'eventEnd' | 'deviceProvision' | 'deviceCount' | 'eventPhotos'> {
	preferredEventDate: string;
}

export interface SharedPlanV1 extends Omit<LegacyBookingConfiguration, 'lunch' | 'toolProvision' | 'codingTools' | 'customCodingTool' | 'message'> {
	v: 1;
	lunch: 'pizza' | 'custom' | 'none';
	consultationMode: 'quick' | 'custom';
	customConsultationDate: string;
}

export interface SharedPlanV2 extends Omit<LegacyBookingConfiguration, 'message'> {
	v: 2;
	consultationMode: 'quick' | 'custom';
	customConsultationDate: string;
}

export interface SharedPlanV3 extends LegacyBookingConfiguration {
	v: 3;
	consultationMode: 'quick' | 'custom';
	customConsultationDate: string;
}

export interface SharedPlanV4 extends Omit<ShareableBookingConfiguration, 'deviceProvision' | 'deviceCount' | 'eventPhotos'> {
	v: 4;
	consultationMode: 'quick' | 'custom';
	customConsultationDate: string;
}

export interface SharedPlanV5 extends ShareableBookingConfiguration {
	v: 5;
	consultationMode: 'quick' | 'custom';
	customConsultationDate: string;
}

export type SharedPlan = SharedPlanV1 | SharedPlanV2 | SharedPlanV3 | SharedPlanV4 | SharedPlanV5;

export function isSharedPlan(value: unknown): value is SharedPlan {
	if (!value || typeof value !== 'object') return false;
	const plan = value as Record<string, unknown>;
	const address = plan.address as Record<string, unknown> | undefined;
	const version = plan.v;
	const strings = ['companyName', 'contactName', 'email', 'phone', 'customLunch', 'consultationSlot', 'customConsultationDate'];
	strings.push(version === 4 || version === 5 ? 'eventStart' : 'preferredEventDate');
	if (version === 4 || version === 5) strings.push('eventEnd');
	if ([2, 3, 4, 5].includes(version as number)) strings.push('customCodingTool');
	if ([3, 4, 5].includes(version as number)) strings.push('message');
	const stringsWithinLimit = strings.every((key) => typeof plan[key] === 'string' && String(plan[key]).length <= 500);
	const validAddress = Boolean(address)
		&& ['label', 'street', 'postalCode', 'city'].every((key) => typeof address?.[key] === 'string' && String(address[key]).length <= 500)
		&& address?.country === 'Deutschland'
		&& (address.latitude === undefined || (typeof address.latitude === 'number' && Number.isFinite(address.latitude)))
		&& (address.longitude === undefined || (typeof address.longitude === 'number' && Number.isFinite(address.longitude)));
	const validCommon = [1, 2, 3, 4, 5].includes(version as number)
		&& [15, 30, 50].includes(plan.capacity as number)
		&& typeof plan.venueProvided === 'boolean'
		&& ['projector', 'tv', 'none'].includes(String(plan.equipment ?? ''))
		&& ['quick', 'custom'].includes(String(plan.consultationMode ?? ''))
		&& validAddress
		&& stringsWithinLimit;
	if (!validCommon) return false;
	if (version === 1) return ['pizza', 'custom', 'none'].includes(String(plan.lunch ?? ''));
	const validToolIds = new Set(CODING_TOOLS.map(({ id }) => id));
	const validTools = ['pizza', 'custom', 'none', 'self-organized'].includes(String(plan.lunch ?? ''))
		&& (plan.toolProvision === null || ['existing', 'needed'].includes(String(plan.toolProvision ?? '')))
		&& Array.isArray(plan.codingTools)
		&& plan.codingTools.every((tool) => validToolIds.has(tool));
	if (!validTools) return false;
	if (version !== 5) return true;
	if (plan.eventPhotos !== undefined && typeof plan.eventPhotos !== 'boolean') return false;
	if (!Number.isInteger(plan.deviceCount)) return false;
	if (plan.deviceProvision === null) return plan.deviceCount === 0;
	return ['existing', 'needed'].includes(String(plan.deviceProvision ?? ''))
		&& (plan.deviceProvision === 'existing'
			? plan.deviceCount === 0
			: (plan.deviceCount as number) >= 1 && (plan.deviceCount as number) <= (plan.capacity as number));
}

export function toSharedPlanV5(plan: SharedPlan): SharedPlanV5 {
	if (plan.v === 5) return plan;
	if (plan.v === 4) return { ...plan, v: 5, deviceProvision: 'existing', deviceCount: 0 };
	if (plan.v === 3) {
		const { preferredEventDate, ...legacy } = plan;
		return { ...legacy, ...eventTimesForDate(preferredEventDate), v: 5, deviceProvision: 'existing', deviceCount: 0 };
	}
	if (plan.v === 2) {
		const { preferredEventDate, ...legacy } = plan;
		return { ...legacy, ...eventTimesForDate(preferredEventDate), v: 5, message: '', deviceProvision: 'existing', deviceCount: 0 };
	}
	const { preferredEventDate, ...legacy } = plan;
	return {
		...legacy,
		...eventTimesForDate(preferredEventDate),
		v: 5,
		toolProvision: null,
		codingTools: [],
		customCodingTool: '',
		message: '',
		deviceProvision: 'existing',
		deviceCount: 0
	};
}
