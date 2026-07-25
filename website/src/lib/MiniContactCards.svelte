<script lang="ts">
	import { Mail, Phone } from 'lucide-svelte';
	import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from './contact';
</script>

<div class="mini-contact-grid" aria-label="Direkter Kontakt">
	<a class="mini-contact-card" href={`tel:${CONTACT_PHONE_HREF}`}>
		<Phone size={22} strokeWidth={1.8} aria-hidden="true" />
		<span><small>Telefon</small>{CONTACT_PHONE_DISPLAY}</span>
	</a>
	<a class="mini-contact-card" href={`mailto:${CONTACT_EMAIL}`}>
		<Mail size={22} strokeWidth={1.8} aria-hidden="true" />
		<span><small>E-Mail</small>{CONTACT_EMAIL}</span>
	</a>
</div>
