import { ModulePage } from "@/components/module-page";

export default function TransactionsPage() {
  return (
    <ModulePage
      title="Inventory Transactions"
      description="Incoming, outgoing, adjustment, transfer, mutation, FIFO, FEFO, and batch tracking with immutable stock ledger."
      stages={["Transaction Draft", "Stock Rule Check", "FIFO/FEFO Allocation", "Approval", "Ledger Posted"]}
      records={["IN-260712-044 / 320 bags", "OUT-260712-067 / branch request", "ADJ-260711-012 / stock opname variance"]}
      actions={["Incoming", "Outgoing", "Adjustment", "Transfer", "Mutation"]}
    />
  );
}
