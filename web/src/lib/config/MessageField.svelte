<script lang="ts">
	let { value, onchange, id = 'message' }: { value: string; onchange: (value: string) => void; id?: string } = $props();
</script>

<div class="field">
	<label for={id}>Ihre Nachricht <span class="optional-label">Optional</span></label>
	<textarea
		{id}
		rows="5"
		maxlength="500"
		placeholder="Gibt es etwas, das wir vorab wissen sollten?"
		value={value}
		oninput={(event) => onchange(event.currentTarget.value)}
	></textarea>
	<small class="field-counter">{value.length}/500</small>
</div>
