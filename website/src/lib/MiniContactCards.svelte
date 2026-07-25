<script lang="ts">
	import { Mail, Phone } from 'lucide-svelte';
	import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from './contact';
</script>

<div class="mini-contact-grid" aria-label="Direkter Kontakt">
	<article class="contact-card mini-contact-card">
		<Phone size={28} strokeWidth={1.7} aria-hidden="true" />
		<h3>Telefon</h3>
		<p>Jederzeit oder schneller Rückruf.</p>
		<a href={`tel:${CONTACT_PHONE_HREF}`}>{CONTACT_PHONE_DISPLAY} <span aria-hidden="true">›</span></a>
	</article>
	<article class="contact-card mini-contact-card">
		<Mail size={28} strokeWidth={1.7} aria-hidden="true" />
		<h3>E-Mail</h3>
		<p>Jederzeit.</p>
		<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL} <span aria-hidden="true">›</span></a>
	</article>
</div>
