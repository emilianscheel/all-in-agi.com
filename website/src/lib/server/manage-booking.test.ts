import { describe, expect, test } from 'bun:test';
import { resolveManagedHackathonId } from './manage-booking';

describe('booking management lookup', () => {
	test('normalizes lowercase IDs and accepts existing bookings', async () => {
		const result = await resolveManagedHackathonId('  haa-aaa-aaa ', (id) => id === 'HAA-AAA-AAA');
		expect(result).toEqual({ ok: true, id: 'HAA-AAA-AAA' });
		expect(await resolveManagedHackathonId('haaaaaaaa', () => true)).toEqual({ ok: true, id: 'HAA-AAA-AAA' });
	});

	test('can validate an ID without querying the booking store', async () => {
		expect(await resolveManagedHackathonId('haa-aaa-aaa')).toEqual({ ok: true, id: 'HAA-AAA-AAA' });
	});

	test('rejects malformed and unknown IDs separately', async () => {
		expect(await resolveManagedHackathonId('invalid', () => true)).toMatchObject({ ok: false, status: 400 });
		expect(await resolveManagedHackathonId('HAA-AAA-AAA', () => false)).toMatchObject({ ok: false, status: 404 });
	});
});
