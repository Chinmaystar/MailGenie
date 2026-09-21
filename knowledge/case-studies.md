# Kelvor — Case Studies

Real, verifiable Kelvor projects. Everything below is grounded in the live apps or the user's own product descriptions. Do not add metrics, clients, or results that are not in this file.

## CafeMitra (Cafe ERP) — multi-tenant café management platform

A café operations SaaS Kelvor built. Deployed on Vercel (private access URL). What the live app contains:

- Multi-cafe setup: a platform owner creates cafes with owner credentials; owners log into a dedicated Cafe Owner Panel. Analytics track "Cafes Covered" across the platform.
- QR-style table ordering: every table gets its own public URL (copyable from the admin). Customers open the table URL, browse the menu, and place orders; "each table order keeps its own timeline", with per-order status flow through to "Finish Table" / "Finalize Order".
- POS + kitchen: order status updates from the POS view, and a kitchen view that shows what's being prepared ("Kitchen is working").
- Menu: full menu CRUD with "Bulk Upload Menu CSV" / "Import CSV to Cafe" for fast catalog onboarding.
- Inventory: item-level inventory management with CSV import/download ("Enter the details for the new inventory item", "Download inventory CSV").
- Staff: add/edit staff per cafe.
- Analytics: live order revenue from today, average order value, and dashboard KPIs.

What this proves: Kelvor can build multi-tenant SaaS with role-based access (platform owner / cafe owner / staff / customer), real-time order workflows, QR-code-driven customer journeys, CSV data tooling, and business analytics dashboards.

## Medio — map-based meetup planner

A consumer web app for deciding where to meet (deployed on Vercel at project-medio-rpcz.vercel.app). What the live app contains:

- An interactive Leaflet map where users mark participant origins and destinations ("planner-marker-origin" / "planner-marker-dest").
- Computed meeting points ("nexus" markers) with suggested venues that can be selected on the map ("marker-venue-selected", "meet-dot" visualization).
- Meet scheduling via a date-time picker, and Google sign-in ("Continue with Google").

What this proves: Kelvor can build interactive map/geolocation products, spatial computation (midpoint/nexus logic), and clean consumer auth onboarding with Google.

## Totemood (totemood.com) — the deep dive

The one customer-facing deep dive. Everything below is verifiable on the live site. Do not add metrics, clients, or results that are not in this file.

### Background
Totemood is a custom e-commerce product Kelvor built and operates: premium illustrated tote bags made from each customer's own photo. A customer uploads a picture, Kelvor's pipeline turns it into illustrated artwork, and the finished tote is printed and shipped. The brand is based in Mumbai, India and sells under the taglines "Bags that speak." and "Every memory deserves to be carried."

### What Kelvor engineered

#### Custom order workflow
The core of the product is a made-to-order pipeline that a standard store cart can't express:
1. Customer places an order and uploads their photo.
2. Within 6–8 hours, the illustrated design is sent to the customer on WhatsApp for review.
3. The customer can request minor changes at this stage.
4. Printing starts only after the customer confirms the final design.
5. The finished tote is delivered within 4–6 working days of design approval.

#### Payment model for made-to-order goods
Full cash-on-delivery doesn't work for custom products, so Totemood uses a hybrid: a ₹49 advance collected at checkout to confirm the order and fund the design work (deducted from the final amount), with the balance paid on delivery.

#### Personalization-aware policies
Because every item is custom, customized products are non-returnable; returns or replacements are limited to damaged, defective, or wrong items and require unboxing-video proof.

#### Storefront
Full e-commerce build with customer accounts and sign-in, shop categories (Collections, Custom Totes, Bestsellers), customer reviews, and content sections (Stories, About, FAQ). Operations run through WhatsApp deep links and Instagram (@totemood_gifts).

### What this proves for outreach
Totemood is live, public proof that Kelvor can take an idea from brand concept to a working product business: brand and visual design, a custom storefront, a bespoke order-approval workflow, a tailored payment flow, and the operational glue (WhatsApp-based customer communication) to run it.
