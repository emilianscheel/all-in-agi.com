<script lang="ts">
	let { status, label }: { status: string; label: string } = $props();
</script>

<span class={`booking-status ${status}`}>{label}</span>
