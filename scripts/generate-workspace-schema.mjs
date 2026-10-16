import * as TJS from 'typescript-json-schema';
import fs from 'node:fs';
const program = TJS.getProgramFromFiles(['src/lib/types.ts', 'src/lib/data.ts'], { strictNullChecks: true, skipLibCheck: true, esModuleInterop: true, jsx: 'react', baseUrl: process.cwd(), paths: { '@/*': ['src/*'] } });
const generator = TJS.buildGenerator(program, { required: true, ignoreErrors: false });
const mapping = {
  products:'Product', movements:'StockMovement', categories:'Category', suppliers:'Supplier', warehouses:'Warehouse', racks:'Rack', users:'ManagedUser',
  purchaseOrders:'PurchaseOrder', receipts:'Receipt', distributions:'Distribution', requests:'ItemRequest', opnameSessions:'OpnameSession', posSales:'PosSale', stores:'Store', invoices:'Invoice', reportProfiles:'ReportProfile', weeklyReports:'WeeklyReport', ponds:'Pond', fishCycles:'FishCycle', pondLogs:'PondDailyLog', pondHarvests:'PondHarvest', pondJournals:'PondJournal', leleSales:'LeleSale', receivables:'Receivable', payables:'Payable', financeTx:'FinanceTx', financeCategories:'FinanceCategory', leleMovements:'LeleMovement', auditLog:'AuditEntry', settings:'AppSettings'
};
const result = {};
for (const [collection, type] of Object.entries(mapping)) result[collection] = generator.getSchemaForSymbol(type);
fs.writeFileSync('src/lib/workspace-schema.json', JSON.stringify(result, null, 2) + '\n');
