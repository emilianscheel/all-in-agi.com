import { describe, expect, test } from 'bun:test';
import { decryptPlan, encryptPlan } from './plan-token';
import type { SharedPlanV1, SharedPlanV2 } from '$lib/shared-plan';

const plan: SharedPlanV2 = {
	v: 2,
	capacity: 15,
	venueProvided: true,
	equipment: 'projector',
	lunch: 'custom',
	customLunch: 'Vegetarische Bowls',
	toolProvision: 'needed',
	codingTools: ['codex', 'custom'],
	customCodingTool: 'Internes Tool',
	companyName: 'Musterwerke GmbH',
	contactName: 'Ada Beispiel',
	email: 'ada@example.com',
	phone: '+49 30 123456',
	address: { label: 'Musterstraße 1, Berlin', street: 'Musterstraße 1', postalCode: '10115', city: 'Berlin', country: 'Deutschland', latitude: 52.5, longitude: 13.4 },
	preferredEventDate: '2099-06-20',
	consultationSlot: '2099-05-10T10:00:00.000Z',
	consultationMode: 'custom',
	customConsultationDate: '2099-05-10'
};

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
	preferredEventDate: plan.preferredEventDate,
	consultationSlot: plan.consultationSlot,
	consultationMode: plan.consultationMode,
	customConsultationDate: plan.customConsultationDate
};

describe('encrypted plan tokens', () => {
	test('round trips the complete plan', async () => {
		const token = await encryptPlan(plan);
		expect(token).not.toContain(plan.companyName);
		expect(await decryptPlan(token)).toEqual(plan);
	});

	test('migrates a v1 plan to an unanswered v2 tools section', async () => {
		const migrated = await decryptPlan(await encryptPlan(legacyPlan));
		expect(migrated).toEqual({ ...legacyPlan, v: 2, toolProvision: null, codingTools: [], customCodingTool: '' });
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
