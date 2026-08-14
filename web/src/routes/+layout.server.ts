export function load({ locals }) {
	return {
		admin: locals.admin,
		adminEmail: locals.admin.authenticated ? locals.user?.email ?? '' : ''
	};
}

