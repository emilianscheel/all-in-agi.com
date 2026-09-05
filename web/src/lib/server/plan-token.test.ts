import { describe, expect, test } from 'bun:test';
import { decryptPlan, encryptPlan } from './plan-token';
import type { SharedPlanV1, SharedPlanV2, SharedPlanV3, SharedPlanV4, SharedPlanV5, SharedPlanV6 } from '$lib/shared-plan';

const plan: SharedPlanV6 = {
	v: 6,
	capacity: 15,
	venueProvided: true,
	equipment: 'projector',
	lunch: 'custom',
	customLunch: 'Vegetarische Bowls',
	toolProvision: 'needed',
	codingTools: ['codex', 'custom'],
	customCodingTool: 'Internes Tool',
	deviceProvision: 'needed',
	deviceCount: 6,
	companyName: 'Musterwerke GmbH',
	contactName: 'Ada Beispiel',
	email: 'ada@example.com',
	phone: '+49 30 123456',
	message: 'Bitte vegetarische Optionen einplanen.',
	address: { label: 'Musterstraße 1, Berlin', street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland', latitude: 52.5, longitude: 13.4 },
	eventStart: '2099-06-20T07:00:00.000Z',
	eventEnd: '2099-06-20T15:00:00.000Z',
	consultationSlot: '2099-05-10T10:00:00.000Z',
	consultationMode: 'custom',
	customConsultationDate: '2099-05-10'
};

const { eventStart: _eventStart, eventEnd: _eventEnd, deviceProvision: _deviceProvision, deviceCount: _deviceCount, ...planWithoutTimes } = plan;
const v3Plan: SharedPlanV3 = { ...planWithoutTimes, v: 3, preferredEventDate: '2099-06-20' };
const { message: _message, ...planWithoutMessage } = v3Plan;
const v2Plan: SharedPlanV2 = { ...planWithoutMessage, v: 2 };
const { deviceProvision: _v4DeviceProvision, deviceCount: _v4DeviceCount, ...v4Base } = plan;
const v4Plan: SharedPlanV4 = { ...v4Base, v: 4 };
const v5Plan: SharedPlanV5 = { ...plan, v: 5, eventStart: plan.eventStart!, eventEnd: plan.eventEnd! };

const legacyPlan: SharedPlanV1 = {
	v: 1,
	capacity: plan.capacity,
	venueProvided: plan.venueProvided,
	equipment: plan.equipment,
	lunch: 'custom',
	customLunch: plan.customLunch,
	companyName: plan.companyName,
	contactName: plan.contactName,
	email: plan.email,
	phone: plan.phone,
	address: plan.address,
	preferredEventDate: v3Plan.preferredEventDate,
	consultationSlot: plan.consultationSlot,
	consultationMode: plan.consultationMode,
	customConsultationDate: plan.customConsultationDate
};

describe('encrypted plan tokens', () => {
	const standardize = <T extends object>(value: T) => ({
		...value,
		venueProvided: true as const,
		lunch: 'pizza' as const,
		customLunch: '',
		deviceProvision: 'existing' as const,
		deviceCount: 0,
		eventPhotos: true
	});

	test('normalizes the complete plan to the current standard offer', async () => {
		const token = await encryptPlan(plan);
		expect(token).not.toContain(plan.companyName);
		expect(await decryptPlan(token)).toEqual(standardize(plan));
	});

	test('migrates a v2 plan with an empty message', async () => {
		const migrated = await decryptPlan(await encryptPlan(v2Plan));
		const { preferredEventDate: _preferredEventDate, ...legacy } = v2Plan;
		expect(migrated).toEqual(standardize({ ...legacy, v: 6, message: '', eventStart: plan.eventStart, eventEnd: plan.eventEnd }));
	});

	test('migrates a v1 plan to v6 with default event times, unanswered tools and message', async () => {
		const migrated = await decryptPlan(await encryptPlan(legacyPlan));
		const { preferredEventDate: _preferredEventDate, ...legacy } = legacyPlan;
		expect(migrated).toEqual(standardize({ ...legacy, v: 6, eventStart: plan.eventStart, eventEnd: plan.eventEnd, toolProvision: null, codingTools: [], customCodingTool: '', message: '' }));
	});

	test('migrates a v4 plan to free existing devices', async () => {
		expect(await decryptPlan(await encryptPlan(v4Plan))).toEqual(standardize({ ...v4Plan, v: 6 }));
	});

	test('migrates a scheduled v5 plan to v6', async () => {
		expect(await decryptPlan(await encryptPlan(v5Plan))).toEqual(standardize({ ...v5Plan, v: 6 }));
	});

	test('round-trips an explicitly deferred v6 plan', async () => {
		const deferred = { ...plan, eventStart: null, eventEnd: null };
		expect(await decryptPlan(await encryptPlan(deferred))).toEqual(standardize(deferred));
	});

	test('rejects tampered tokens', async () => {
		const token = await encryptPlan(plan);
		const [iv, ciphertext] = token.split('.');
		const tampered = `${iv}.${ciphertext[0] === 'A' ? 'B' : 'A'}${ciphertext.slice(1)}`;
		expect(decryptPlan(tampered)).rejects.toThrow('Ungültiger Plan-Link.');
	});

	test('rejects a token encrypted with another secret', async () => {
		const token = await encryptPlan(plan, 'secret-a');
		expect(decryptPlan(token, 'secret-b')).rejects.toThrow('Ungültiger Plan-Link.');
	});

	test('rejects oversized fields', async () => {
		expect(encryptPlan({ ...plan, companyName: 'x'.repeat(501) })).rejects.toThrow('Ungültige Plandaten.');
	});
});
