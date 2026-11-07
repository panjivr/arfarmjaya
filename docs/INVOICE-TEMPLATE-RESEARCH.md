# Invoice template research and design notes

Reviewed 2026-11-07. This is representative research, not a claim to have inspected every startup or every industry.

## Sources actually inspected

- [Stripe official OpenAPI specification](https://github.com/stripe/openapi/blob/6360907/openapi/spec3.json), commit 6360907: inspected invoice, invoice_rendering_template, invoices_resource_invoice_rendering, invoice_setting_customer_rendering_options, and invoice_rendering_pdf. Relevant patterns: unique invoice number; customer identity frozen after finalization; custom fields and footer; a default template that can be overridden on an invoice; template versioning; internal template nickname hidden from recipients; PDF page-size settings. This informed persistence, overrides, and internal-only template labels. It is a schema/reference inspection, not an inspection of Stripe's visual PDF templates.

- [InvoiceShelf: invoice samples](https://github.com/InvoiceShelf/InvoiceShelf/tree/c8d10f7/resources/static/img/PDF): visually inspected invoice1.png, invoice2.png, invoice3.png. Patterns: centered logo with sender/customer blocks; a full-width colored masthead; split logo/company identification; number, dates and due date grouped separately; restrained line tables; right-aligned totals. Read repository context at commit c8d10f7. The referenced default branch is an upstream alpha; no upstream runtime/dependencies were installed in our app.
- [Invoice Ninja: PDF designs](https://github.com/invoiceninja/invoiceninja/tree/15ea35e/resources/views/pdf-designs): inspected the structural sections and style declarations of clean, business, bold, elegant, modern, plain, tech, creative at commit 15ea35e. Patterns: variable column ratios, logo/sender placement, distinct customer/document blocks, simple versus strong headers, whitespace, product tables, total/terms sections. No template source, branded assets or vendor code was copied into the application.

The implementation is an original composition system using these general document conventions. Names such as Atlas, Flux and Maison identify our presets; they do not imply affiliation with another company.

## Sources attempted but unavailable

The cloud proxy rejected CONNECT with HTTP 403 for:

- https://stripe.com/invoicing
- https://squareup.com/us/en/invoices/invoice-templates
- https://www.freshbooks.com/invoice-templates
- https://www.zoho.com/invoice/templates/

A network draft adds those hosts while preserving the existing allowlist. The draft has not established runtime access. Do not cite these pages as having been read or claim pixel-perfect duplicates of their documents.

## Decisions implemented

32 versioned templates across 8 categories: Korporat, Digital, Minimal, Kreatif, Retail, Grosir, Jasa, Premium. The registry uses 16 header compositions and independently chooses metadata arrangement, table treatment, total placement, closing order, flow, typography and density. Every registry entry has a different structural tuple; colors alone do not count as a new template.

Stable IDs ending in -v1 retain the preset definition for saved invoices. Future changes to a preset composition need a new versioned ID. No template ID is added to legacy classic/modern invoices. Unknown IDs safely fall back to the old layout. A preset applies its starting palette and logo size, preserves visibility choices, and allows subsequent per-part customization.

Store identity and invoice data remain store-specific. The gallery category, template name, application name and a provider watermark are not added to the printed invoice. This is an output-design feature, not a new promise about tenant isolation or backend data access.

Financial clarity is invariant across templates: buyer, seller, invoice number/date, line quantities/amounts, and grand total remain present. Nonzero shipping/discount adjustments stay visible. Signed invoices keep QR and integrity information. No new legal/tax certification or jurisdiction-specific compliance is claimed.
