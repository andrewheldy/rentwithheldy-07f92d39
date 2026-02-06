

# Category-Based Car Rental System - Implementation Plan

## Overview

This plan transforms the current vehicle-specific rental model into an enterprise-style category-based booking system (similar to Enterprise, Hertz, etc.). Customers will select vehicle categories (e.g., "SUV", "Sedan", "Luxury") rather than specific cars. Actual vehicles are assigned automatically from backend inventory.

---

## Current State Analysis

**Existing Architecture:**
- Frontend displays individual vehicles with specific details (make, model, year)
- `vehicles` table stores physical car inventory
- `booking_inquiries` table captures customer requests for specific vehicles
- Static fallback data in `src/data/vehicles.ts`
- Admin can add vehicles via `/addcars` page

**What Needs to Change:**
- Frontend shifts from showing individual cars to showing categories
- New database tables for categories and reservations
- Availability logic based on category + date range
- Backend logic for automatic vehicle assignment
- New booking search flow with date/location selection

---

## Database Schema Changes

### New Table: `vehicle_categories`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Display name (e.g., "Economy Sedan") |
| slug | text | URL-friendly identifier |
| hero_image | text | Category display image URL |
| description | text | Marketing description |
| passenger_capacity | integer | Max passengers |
| bag_capacity | integer | Max bags/luggage |
| price_per_day | numeric | Daily rate |
| price_per_week | numeric | Weekly rate (optional discount) |
| active | boolean | Show on frontend |
| created_at | timestamp | Auto-generated |

### Modified Table: `vehicles`

Add new columns to existing table:
| Column | Type | Description |
|--------|------|-------------|
| category_id | uuid | Foreign key to vehicle_categories |
| status | text | "available", "rented", "maintenance" |
| location | text | Current location |

### New Table: `reservations`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| category_id | uuid | Foreign key to vehicle_categories |
| vehicle_id | uuid | Foreign key to vehicles (nullable - assigned later) |
| start_date | date | Pickup date |
| end_date | date | Return date |
| pickup_location | text | Pickup point |
| dropoff_location | text | Return point |
| customer_name | text | Customer name |
| customer_email | text | Customer email |
| customer_phone | text | Customer phone |
| payment_status | text | "pending", "paid", "failed", "refunded" |
| status | text | "confirmed", "needs_assignment", "completed", "cancelled" |
| created_at | timestamp | Auto-generated |

---

## Frontend Architecture Changes

### New Pages

1. **`/book` - Booking Search Page**
   - Date picker for pickup/return
   - Location selector
   - Optional driver age input
   - "Search Available Categories" button

2. **`/categories` - Category Selection Page**
   - Grid of available category cards
   - Each card shows: image, name, capacity, "From $X/day"
   - Only categories with available inventory appear
   - "Reserve" CTA on each card

3. **`/reserve/:categorySlug` - Reservation Details Page**
   - Category summary with "or similar" language
   - Customer information form
   - Optional add-ons
   - Price breakdown
   - Submit creates reservation at category level

4. **`/confirmation/:reservationId` - Confirmation Page**
   - Booking summary
   - "Vehicle assigned at pickup" messaging
   - Contact information

### Modified Pages

- **Homepage (`/`)**: Replace vehicle cards with category cards; add booking search widget
- **`/vehicles`**: Redirect or repurpose as category browser

### New Components

- `CategoryCard.tsx` - Display category with capacity icons
- `BookingSearchForm.tsx` - Date/location picker widget
- `ReservationForm.tsx` - Customer details form
- `CategoryGrid.tsx` - Grid layout for categories

### Removed/Deprecated

- Individual vehicle detail pages (repurpose for admin only)
- Vehicle-specific booking dialog

---

## Availability Logic

A category is available when:

1. At least one vehicle exists in that category
2. Vehicle status = "available"
3. Vehicle is NOT assigned to an overlapping reservation

```text
Query Logic:
+---------------------------+
| Get selected date range   |
+---------------------------+
            |
            v
+---------------------------+
| Find vehicles by category |
| WHERE status = available  |
+---------------------------+
            |
            v
+---------------------------+
| Exclude vehicles with     |
| overlapping reservations  |
+---------------------------+
            |
            v
+---------------------------+
| Category available if     |
| count > 0                 |
+---------------------------+
```

---

## Backend Functions (Edge Functions)

### 1. `check-availability`

- Input: start_date, end_date, location (optional)
- Output: List of available categories with vehicle count
- Used by: Category selection page

### 2. `create-reservation`

- Input: category_id, dates, customer info
- Process:
  - Validate category availability
  - Create reservation record
  - Attempt auto-assignment if enabled
- Output: Reservation ID + confirmation details

### 3. `assign-vehicle` (admin/automatic)

- Input: reservation_id
- Process:
  - Find first available vehicle in category
  - Assign to reservation
  - Update vehicle status for date range
- Output: Assigned vehicle details or "needs_manual_assignment"

---

## Admin Dashboard Enhancements

Add to existing admin functionality:

1. **Category Management** - CRUD for vehicle categories
2. **Vehicle Status** - Mark vehicles as available/maintenance/rented
3. **Reservation List** - View by date, category, status
4. **Manual Assignment** - Override auto-assignment
5. **Fleet Overview** - Category inventory counts

---

## UX Copy Guidelines

- Always use "or similar" when showing category examples
- Emphasize benefits: "Spacious SUV" not "2024 Honda CR-V"
- Confirmation page: "Your vehicle details will be provided at pickup"
- Never promise a specific car unless upgraded

---

## Implementation Phases

### Phase 1: Database Schema
- Create `vehicle_categories` table
- Add columns to `vehicles` table
- Create `reservations` table
- Set up RLS policies
- Migrate existing vehicles to categories

### Phase 2: Backend Logic
- Create availability check edge function
- Create reservation creation logic
- Build auto-assignment function

### Phase 3: Customer-Facing Frontend
- Build booking search form
- Create category selection page
- Build reservation flow
- Update homepage with new design

### Phase 4: Admin Dashboard
- Category management UI
- Reservation management
- Vehicle assignment interface
- Fleet status overview

---

## Technical Considerations

- **Existing Data**: The 20+ vehicles in static data will need category assignments
- **Booking Inquiries Table**: Keep for legacy; new flow uses `reservations`
- **RLS Policies**: Public can view categories; authenticated admins manage all
- **Real-time**: Consider for live availability updates

---

## Summary

This architectural change transforms the site from a peer-to-peer style rental (specific cars) to an enterprise rental model (book by category). The key benefits are:

- Scalable fleet management
- Cleaner customer experience
- Dynamic availability
- Backend operational flexibility
- Professional enterprise rental feel
