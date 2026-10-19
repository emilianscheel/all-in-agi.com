<script lang="ts">
	let {
		id,
		companyName,
		contactName,
		contactEmail
	}: {
		id: string;
		companyName: string;
		contactName: string;
		contactEmail: string;
	} = $props();
</script>

<a class="booking-primary-link" href={`/${id}`} target="_blank" rel="noopener noreferrer">
	<strong>{companyName}</strong>
	<small>{id} · {contactName}</small>
	<small>{contactEmail}</small>
</a>
