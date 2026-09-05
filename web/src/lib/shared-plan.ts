import { CODING_TOOLS, STANDARD_HACKATHON_OPTIONS, type BookingConfiguration } from './booking';
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

export interface SharedPlanV5 extends Omit<ShareableBookingConfiguration, 'eventStart' | 'eventEnd'> {
	v: 5;
	eventStart: string;
	eventEnd: string;
	consultationMode: 'quick' | 'custom';
	customConsultationDate: string;
}

export interface SharedPlanV6 extends ShareableBookingConfiguration {
	v: 6;
	consultationMode: 'quick' | 'custom';
	customConsultationDate: string;
}

export type SharedPlan = SharedPlanV1 | SharedPlanV2 | SharedPlanV3 | SharedPlanV4 | SharedPlanV5 | SharedPlanV6;

export function isSharedPlan(value: unknown): value is SharedPlan {
	if (!value || typeof value !== 'object') return false;
	const plan = value as Record<string, unknown>;
	const address = plan.address as Record<string, unknown> | undefined;
	const version = plan.v;
	const strings = ['companyName', 'contactName', 'email', 'phone', 'customLunch', 'consultationSlot', 'customConsultationDate'];
	if (version !== 6) strings.push(version === 4 || version === 5 ? 'eventStart' : 'preferredEventDate');
	if (version === 4 || version === 5) strings.push('eventEnd');
	if ([2, 3, 4, 5, 6].includes(version as number)) strings.push('customCodingTool');
	if ([3, 4, 5, 6].includes(version as number)) strings.push('message');
	const stringsWithinLimit = strings.every((key) => typeof plan[key] === 'string' && String(plan[key]).length <= 500);
	const validAddress = Boolean(address)
		&& ['label', 'street', 'postalCode', 'city'].every((key) => typeof address?.[key] === 'string' && String(address[key]).length <= 500)
		&& address?.country === 'Deutschland'
		&& (address.latitude === undefined || (typeof address.latitude === 'number' && Number.isFinite(address.latitude)))
		&& (address.longitude === undefined || (typeof address.longitude === 'number' && Number.isFinite(address.longitude)));
	const validEventTime = version !== 6 || (
		(plan.eventStart === null && plan.eventEnd === null)
		|| (typeof plan.eventStart === 'string' && plan.eventStart.length <= 500 && typeof plan.eventEnd === 'string' && plan.eventEnd.length <= 500)
	);
	const validCommon = [1, 2, 3, 4, 5, 6].includes(version as number)
		&& [15, 30, 50].includes(plan.capacity as number)
		&& typeof plan.venueProvided === 'boolean'
		&& ['projector', 'tv', 'none'].includes(String(plan.equipment ?? ''))
		&& ['quick', 'custom'].includes(String(plan.consultationMode ?? ''))
		&& validAddress
		&& stringsWithinLimit
		&& validEventTime;
	if (!validCommon) return false;
	if (version === 1) return ['pizza', 'custom', 'none'].includes(String(plan.lunch ?? ''));
	if ((version === 5 || version === 6) && plan.locale !== undefined && !['de', 'en'].includes(String(plan.locale))) return false;
	const validToolIds = new Set(CODING_TOOLS.map(({ id }) => id));
	const validTools = ['pizza', 'custom', 'none', 'self-organized'].includes(String(plan.lunch ?? ''))
		&& (plan.toolProvision === null || ['existing', 'needed'].includes(String(plan.toolProvision ?? '')))
		&& Array.isArray(plan.codingTools)
		&& plan.codingTools.every((tool) => validToolIds.has(tool));
	if (!validTools) return false;
	if (version !== 5 && version !== 6) return true;
	if (plan.eventPhotos !== undefined && typeof plan.eventPhotos !== 'boolean') return false;
	if (!Number.isInteger(plan.deviceCount)) return false;
	if (plan.deviceProvision === null) return plan.deviceCount === 0;
	return ['existing', 'needed'].includes(String(plan.deviceProvision ?? ''))
		&& (plan.deviceProvision === 'existing'
			? plan.deviceCount === 0
			: (plan.deviceCount as number) >= 1 && (plan.deviceCount as number) <= (plan.capacity as number));
}

export function toSharedPlanV6(plan: SharedPlan): SharedPlanV6 {
	let migrated: SharedPlanV6;
	if (plan.v === 6) migrated = plan;
	else if (plan.v === 5) migrated = { ...plan, v: 6 };
	else if (plan.v === 4) migrated = { ...plan, v: 6, deviceProvision: 'existing', deviceCount: 0 };
	else if (plan.v === 3) {
		const { preferredEventDate, ...legacy } = plan;
		migrated = { ...legacy, ...eventTimesForDate(preferredEventDate), v: 6, deviceProvision: 'existing', deviceCount: 0 };
	}
	else if (plan.v === 2) {
		const { preferredEventDate, ...legacy } = plan;
		migrated = { ...legacy, ...eventTimesForDate(preferredEventDate), v: 6, message: '', deviceProvision: 'existing', deviceCount: 0 };
	}
	else {
		const { preferredEventDate, ...legacy } = plan;
		migrated = {
			...legacy,
			...eventTimesForDate(preferredEventDate),
			v: 6,
			toolProvision: null,
			codingTools: [],
			customCodingTool: '',
			message: '',
			deviceProvision: 'existing',
			deviceCount: 0
		};
	}
	return { ...migrated, ...STANDARD_HACKATHON_OPTIONS };
}
