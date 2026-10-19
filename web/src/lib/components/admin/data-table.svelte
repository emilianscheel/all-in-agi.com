<script lang="ts">
	import { FlexRender } from '@tanstack/svelte-table';
	import * as Table from '$lib/components/ui/table/index.js';

	let {
		table,
		columnCount,
		emptyMessage = 'No results.'
	}: {
		table: {
			getHeaderGroups: () => Array<{ id: string; headers: any[] }>;
			getRowModel: () => { rows: Array<{ id: string; getAllCells: () => any[] }> };
		};
		columnCount: number;
		emptyMessage?: string;
	} = $props();
</script>

<div class="admin-data-table overflow-hidden rounded-2xl border border-border bg-card">
	<Table.Root class="border-separate border-spacing-0">
		<Table.Header>
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row class="hover:bg-transparent">
					{#each headerGroup.headers as header (header.id)}
						<Table.Head
							class="bg-muted px-4 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase"
						>
							{#if !header.isPlaceholder}
								<FlexRender {header} />
							{/if}
						</Table.Head>
					{/each}
				</Table.Row>
			{/each}
		</Table.Header>
		<Table.Body>
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row>
					{#each row.getAllCells() as cell (cell.id)}
						<Table.Cell class="px-4 py-4">
							<FlexRender {cell} />
						</Table.Cell>
					{/each}
				</Table.Row>
			{:else}
				<Table.Row class="hover:bg-transparent">
					<Table.Cell colspan={columnCount} class="text-muted-foreground h-24 text-center">
						{emptyMessage}
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

<style>
	.admin-data-table :global(table),
	.admin-data-table :global(thead),
	.admin-data-table :global(tbody),
	.admin-data-table :global(tr),
	.admin-data-table :global(th),
	.admin-data-table :global(td) {
		border: 0 !important;
		border-width: 0 !important;
		box-shadow: none !important;
	}
</style>
