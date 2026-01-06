# Chisan Paper Manager - Project Overview

**Last Updated:** 2026-01-05

## Project Goal

A comprehensive system to manage, upload, parse, and compare Technical Data Sheets (TDS) for the paper industry.

## Core Workflows

### 1. TDS Upload & Parsing

- **Input**: PDF Documents (Drag & Drop).
- **Processing**:
  - Uses **Claude Vision API** to read PDF content, preserving table structures.
  - **Standardization**: Automatically converts extracted units to system standards:
    - Thickness: **µm**
    - Tensile: **kN/m**
    - Tear: **mN**
    - Stiffness: **mN·m**
- **Validation**: Strict schema validation ensures data integrity before database insertion.

### 2. Dashboard & Management

- **Product List**: Overview of Mills, Products, and Categories.
- **Spec Management**:
  - **Expandable Rows**: View all GSM variants for a product.
  - **Interaction**:
    - **Checkbox**: Select specs for comparison (up to 10).
    - **Info Button**: Open detailed sidebar view without altering selection.
  - **Sidebar**: Detailed view of all physical, optical, and strength properties.

### 3. Comparison Engine

- **Visual Comparison**: Side-by-side bar charts for selected specs.
- **Metrics Covered**:
  - Caliper (µm)
  - Tensile Strength (MD/CD)
  - Tear Strength (MD/CD)
  - Stiffness (MD/CD)
- **Data Handling**: Missing values default to 0 for clear visual indication of data gaps.

## Technical Architecture

### Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Testing**: Vitest (Unit & Integration)

### Key Directories

- `app/(dashboard)`: Main application routes.
- `lib/ai/tds-parser.ts`: Core parsing logic with normalization.
- `utils/unit-converters.ts`: Unit conversion logic.
- `components/products`: Dashboard tables and comparison charts.
- `types/database.ts`: TypeScript definitions for DB schema.

## Recent Updates (Jan 2026)

- **Unit Standardization**: Enforced strict unit conversion during parsing.
- **UX Improvements**: Separated "View" and "Select" actions in dashboard.
- **Chart Upgrades**: Added Stiffness metrics and robust null value handling.
