<script lang="ts">
	let { name, id }: { name: string; id: string } = $props();
</script>

<div class="booking-primary-link">
	<strong>{name}</strong>
	<small>{id}</small>
</div>
