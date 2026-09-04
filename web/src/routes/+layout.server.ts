export function load({ locals }) {
	return {
		locale: locals.locale,
		admin: locals.admin,
		adminEmail: locals.admin.authenticated ? locals.user?.email ?? '' : ''
	};
}
