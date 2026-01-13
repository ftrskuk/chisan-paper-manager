# Multi-App SaaS Expansion Plan

> **Created**: 2026-01-13  
> **Status**: Phase 1 In Progress  
> **Projects**: chisan-paper-manager, import-hub-chisan, future SCM/ERP/Operations

---

## 📋 Executive Summary

This plan outlines the strategy to expand from two separate applications (Paper Manager + Import Hub) into a unified multi-app SaaS ecosystem with shared master data and optimized infrastructure.

### Key Decisions Made

| Decision              | Choice                             | Rationale                         |
| --------------------- | ---------------------------------- | --------------------------------- |
| Database Architecture | **Keep Separate** (Loose Coupling) | Simpler, less complexity          |
| File Storage          | **Cloudflare R2**                  | 30x cheaper than Supabase Storage |
| Master Data Sync      | **Manual/API Bridge**              | Add complexity only when needed   |
| Future Database       | **Neon or AWS Aurora**             | Migrate when scaling requires it  |

---

## 🏗️ Current Architecture

### Project 1: chisan-paper-manager

**Purpose**: Technical Data Sheet (TDS) management for paper products

**Location**: `/home/david/projects/chisan-paper-manager`

**Tech Stack**:

- Next.js 14, React 18, TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- Tailwind CSS, shadcn/ui
- Vitest for TDD

**Database Schema**:

```
profiles (user auth/roles)
    │
categories (Kraft, Coated, Testliner, etc.)
    │
products (mill_name, product_name, category_id)
    │
    └──▶ product_specs (gsm, caliper, tensile, tear, brightness, etc.)
```

**Key Features**:

- ✅ AI-powered PDF parsing (Claude)
- ✅ Multi-spec product management
- ✅ Product comparison
- ✅ Category management

---

### Project 2: import-hub-chisan

**Purpose**: Import logistics and order management

**Location**: `/home/david/projects/import-hub-chisan`

**Tech Stack**:

- Next.js 15, React 19, TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- TanStack Query v5
- Tailwind CSS 4, shadcn/ui

**Database Schema**:

```
users (RBAC: ADMIN, STAFF)
    │
partners (SUPPLIER, SHIPPER, CUSTOMER, WAREHOUSE)
    │
products (code, name, category: ROLL/SHEET, specs JSONB)
    │
orders (order_no, supplier, B/L, ETD/ETA, LC, status)
    │
    ├──▶ order_items (product_id, gsm, width, quantity, weight)
    └──▶ documents (CONTRACT, SHIPPING_DOCS, CUSTOMS, etc.)
```

**Key Features**:

- ✅ Order lifecycle tracking (ORDERED → SHIPPED → ARRIVED → CUSTOMS_CLEARED → DELIVERED)
- ✅ Document management
- ✅ Partner management
- ✅ Audit logging

---

## 🎯 Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────┐              ┌─────────────────────┐              │
│   │  Supabase Project A │              │  Supabase Project B │              │
│   │  (Paper Manager DB) │              │  (Import Hub DB)    │              │
│   │                     │              │                     │              │
│   │  - products         │   ──sync──▶  │  - products (ref)   │              │
│   │  - product_specs    │              │  - orders           │              │
│   │  - item_master (NEW)│              │  - order_items      │              │
│   │  - categories       │              │  - partners         │              │
│   └─────────────────────┘              └─────────────────────┘              │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Cloudflare R2 (Shared Storage)                    │   │
│   │                                                                      │   │
│   │   /tds-pdfs/              /shipping-docs/           /invoices/      │   │
│   │   (Paper Manager)         (Import Hub)              (ERP - Future)  │   │
│   │                                                                      │   │
│   │   + Automatic CDN (global edge caching)                             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                │                    │                    │
                ▼                    ▼                    ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│   Paper Manager   │  │    Import Hub     │  │   Future Apps     │
│   (App 1)         │  │    (App 2)        │  │   (SCM/ERP/Ops)   │
│                   │  │                   │  │                   │
│   Vercel Deploy   │  │   Vercel Deploy   │  │   Vercel Deploy   │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

---

## 📦 Phase 1: Cloudflare R2 Migration (Priority: HIGH)

### 1.1 Create Cloudflare R2 Bucket

```bash
# Via Cloudflare Dashboard
# 1. Go to R2 → Create Bucket
# 2. Bucket name: "chisan-files" or "jisan-files"
# 3. Location: APAC (closest to Korea)
```

### 1.2 Environment Variables

Add to both projects' `.env.local`:

```env
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=chisan-files
R2_PUBLIC_URL=https://files.your-domain.com  # Optional custom domain
```

### 1.3 Install Dependencies

```bash
# Both projects
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 1.4 Create R2 Client Utility

**File**: `lib/storage/r2-client.ts` (create in both projects)

```typescript
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function generateUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(R2, command, { expiresIn: 3600 }) // 1 hour
}

export async function generateDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  })
  return getSignedUrl(R2, command, { expiresIn: 3600 })
}

export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  })
  return R2.send(command)
}
```

### 1.5 Folder Structure in R2

```
chisan-files/
├── tds-pdfs/                    # Paper Manager TDS uploads
│   ├── hansol/
│   │   ├── hi-q-coated_20260113.pdf
│   │   └── ...
│   └── moorim/
│       └── ...
├── shipping-docs/               # Import Hub documents
│   ├── 2026/
│   │   ├── 01/
│   │   │   ├── BL-CS2601001.pdf
│   │   │   ├── CI-CS2601001.pdf
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── contracts/                   # Import Hub contracts
│   └── ...
└── customs/                     # Import Hub customs docs
    └── ...
```

### 1.6 Migration Steps

1. **Export existing files from Supabase Storage**
2. **Upload to R2 with new key structure**
3. **Update database records with new URLs**
4. **Update application code to use R2 client**
5. **Test thoroughly**
6. **Delete old Supabase Storage files**

---

## 📦 Phase 2: Item Master Table (Priority: MEDIUM)

### 2.1 Purpose

Create a bridge between technical specs (Paper Manager) and commercial operations (Import Hub).

### 2.2 Schema (in chisan-paper-manager)

```sql
-- Migration: Add item_master table
-- Location: supabase/migrations/YYYYMMDD_add_item_master.sql

-- Product format enum
CREATE TYPE product_format AS ENUM ('ROLL', 'SHEET');

-- Item master table
CREATE TABLE item_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to product specs
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_spec_id UUID REFERENCES product_specs(id) ON DELETE SET NULL,

  -- SKU identification
  sku_code VARCHAR(30) UNIQUE NOT NULL,  -- e.g., "HANSOL-WF-80-1200R"
  item_name VARCHAR(100) NOT NULL,        -- Display name for other apps
  item_name_ko VARCHAR(100),              -- Korean name

  -- Format specification
  format product_format NOT NULL,

  -- Roll specifications
  width_mm INTEGER,
  core_size VARCHAR(20),  -- "3 inch", "76mm", "6 inch", "152mm"

  -- Sheet specifications
  sheet_width_mm INTEGER,
  sheet_length_mm INTEGER,
  grain_direction VARCHAR(10),  -- "LG" (Long Grain), "SG" (Short Grain)

  -- Commercial attributes
  hs_code VARCHAR(20),           -- Customs HS code (e.g., "4810.19")
  default_unit VARCHAR(20) DEFAULT 'MT',  -- MT, ROLL, REAM, SHEET
  min_order_qty DECIMAL(10,2),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_item_master_product ON item_master(product_id);
CREATE INDEX idx_item_master_spec ON item_master(product_spec_id);
CREATE INDEX idx_item_master_sku ON item_master(sku_code);
CREATE INDEX idx_item_master_active ON item_master(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE item_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view item_master"
  ON item_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage item_master"
  ON item_master FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Updated_at trigger
CREATE TRIGGER item_master_updated_at
  BEFORE UPDATE ON item_master
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 2.3 SKU Naming Convention

```
{MILL}-{GRADE}-{GSM}-{WIDTH}{FORMAT}

Examples:
- HANSOL-WF-80-1200R     → Hansol Woodfree 80gsm 1200mm Roll
- MOORIM-ART-150-788S    → Moorim Art Paper 150gsm 788mm Sheet
- APP-KRAFT-200-1100R    → APP Kraft 200gsm 1100mm Roll
```

### 2.4 TypeScript Types

```typescript
// types/database.ts (add to Paper Manager)

export type ProductFormat = 'ROLL' | 'SHEET'

export interface ItemMaster {
  id: string
  product_id: string
  product_spec_id: string | null
  sku_code: string
  item_name: string
  item_name_ko: string | null
  format: ProductFormat
  width_mm: number | null
  core_size: string | null
  sheet_width_mm: number | null
  sheet_length_mm: number | null
  grain_direction: string | null
  hs_code: string | null
  default_unit: string
  min_order_qty: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ItemMasterWithDetails extends ItemMaster {
  products: Product
  product_specs: ProductSpec | null
}
```

---

## 📦 Phase 3: Cross-App Integration (Priority: LOW)

### 3.1 Option A: Manual Sync (Simplest)

When adding a product in Paper Manager:

1. Create product + specs
2. Create item_master entry with SKU
3. Manually add same product to Import Hub with matching code

### 3.2 Option B: API Bridge (Recommended for Scale)

**Paper Manager exposes REST API**:

```typescript
// app/api/items/route.ts (Paper Manager)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const active = searchParams.get('active') !== 'false'

  const supabase = await createClient()
  const { data } = await supabase
    .from('item_master')
    .select(
      `
      *,
      products (mill_name, name),
      product_specs (gsm, caliper, brightness)
    `
    )
    .eq('is_active', active)

  return Response.json(data)
}
```

**Import Hub fetches items**:

```typescript
// lib/api/paper-manager.ts (Import Hub)
export async function fetchItems() {
  const res = await fetch(`${process.env.PAPER_MANAGER_API_URL}/api/items`, {
    headers: {
      Authorization: `Bearer ${process.env.PAPER_MANAGER_API_KEY}`,
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  })
  return res.json()
}
```

### 3.3 Option C: Shared Database (Future - When Needed)

Merge both apps into single Supabase project when:

- You have 3+ apps sharing same data
- Real-time sync becomes critical
- Manual sync becomes too error-prone

---

## 📦 Phase 4: Future Apps Planning

### 4.1 SCM SaaS (Supply Chain Management)

**Focus**: Inventory, Purchase Orders, Sales Orders

**New Tables**:

```sql
-- Inventory tracking (physical rolls)
inventory_items (
  id, item_master_id,
  tappi_roll_id,        -- TAPPI standard roll number
  warehouse_id, location,
  net_weight_kg, gross_weight_kg,
  received_date, status
)

-- Purchase orders
purchase_orders (
  id, po_number, supplier_id,
  order_date, expected_date,
  status, total_amount
)

-- Sales orders
sales_orders (
  id, so_number, customer_id,
  order_date, delivery_date,
  status, total_amount
)
```

### 4.2 ERP SaaS

**Focus**: Pricing, Costing, Invoicing, Financial

**New Tables**:

```sql
-- Price lists
price_lists (
  id, item_master_id, customer_id,
  currency, unit_price,
  valid_from, valid_to
)

-- Cost records
item_costs (
  id, item_master_id,
  purchase_cost, freight_cost, customs_cost,
  total_landed_cost, effective_date
)

-- Invoices
invoices (
  id, invoice_number, customer_id,
  invoice_date, due_date,
  subtotal, tax, total, status
)
```

### 4.3 Operations SaaS

**Focus**: Warehouse, Cutting, Quality Control

**New Tables**:

```sql
-- Warehouse locations
warehouses (id, name, address, capacity)
warehouse_locations (id, warehouse_id, zone, rack, level)

-- Cutting orders (roll → sheets)
cutting_orders (
  id, source_roll_id,
  target_width, target_length,
  quantity, yield_percentage
)

-- Quality control
qc_inspections (
  id, inventory_item_id,
  inspector_id, inspection_date,
  gsm_actual, caliper_actual,
  brightness_actual, result
)
```

---

## 🗓️ Implementation Timeline

| Phase                     | Duration  | Priority | Dependencies |
| ------------------------- | --------- | -------- | ------------ |
| **Phase 1**: R2 Migration | 1-2 weeks | HIGH     | None         |
| **Phase 2**: Item Master  | 1 week    | MEDIUM   | Phase 1      |
| **Phase 3**: API Bridge   | 1 week    | LOW      | Phase 2      |
| **Phase 4a**: SCM SaaS    | 4-6 weeks | Future   | Phase 2      |
| **Phase 4b**: ERP SaaS    | 4-6 weeks | Future   | Phase 4a     |
| **Phase 4c**: Operations  | 4-6 weeks | Future   | Phase 4a     |

---

## 📋 Immediate Next Steps

### This Week (Manual Steps Required)

1. [ ] Create Cloudflare account (if not exists)
2. [ ] Create R2 bucket "chisan-files"
3. [ ] Generate R2 API keys
4. [ ] Add R2 environment variables to .env.local

### Completed (2026-01-13)

5. [x] Implement R2 client in Paper Manager (`lib/storage/r2-client.ts`)
6. [x] Create storage abstraction layer (`lib/storage/storage.ts`)
7. [x] Update tds-upload.ts to use R2
8. [x] Update pdf-upload.ts to use R2
9. [x] Add unit tests for storage utilities (14 tests)
10. [x] Add .env.example with R2 variables

### Next Steps

11. [ ] Configure R2 bucket and add credentials to .env.local
12. [ ] Test PDF upload to R2 in production
13. [ ] Migrate existing PDFs from Supabase Storage
14. [ ] Implement R2 in Import Hub

### Following Weeks

15. [ ] Create item_master table in Paper Manager
16. [ ] Build Item Master UI in Paper Manager
17. [ ] Create items API endpoint

---

## 💰 Cost Projection

### Current (Supabase Storage)

| Item                         | Monthly Cost   |
| ---------------------------- | -------------- |
| Supabase Pro (Paper Manager) | $25            |
| Supabase Pro (Import Hub)    | $25            |
| Storage (estimated 10GB)     | $5             |
| Egress (estimated 50GB)      | $4.50          |
| **Total**                    | **~$60/month** |

### After R2 Migration

| Item                               | Monthly Cost   |
| ---------------------------------- | -------------- |
| Supabase Pro (Paper Manager)       | $25            |
| Supabase Pro (Import Hub)          | $25            |
| Cloudflare R2 (10GB + 50GB egress) | $0.15          |
| **Total**                          | **~$50/month** |

**Annual Savings**: ~$120/year (grows as storage increases)

---

## 📚 Reference Links

### Cloudflare R2

- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/)

### Next.js + R2 Integration

- [Presigned URLs Guide](https://developers.cloudflare.com/r2/examples/aws-sdk-js-v3/)
- [File Upload Tutorial](https://developers.cloudflare.com/workers/tutorials/upload-assets-with-r2/)

### Supabase

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🔑 Key Principles

1. **Keep It Simple**: Don't over-engineer. Add complexity only when needed.
2. **Loose Coupling**: Apps should work independently but can share data.
3. **Master Data**: Paper Manager is the source of truth for product specs.
4. **Cost Efficiency**: Use R2 for storage, Supabase for database.
5. **Incremental Migration**: Migrate one feature at a time, not big bang.

---

_Last Updated: 2026-01-13_
