

# Populate Vehicle Fleet Database

The categories page shows "no cars available" because the **vehicles table is empty**. There's static data with 20 vehicles that needs to be migrated to the database and assigned to categories.

## Root Cause

- 6 vehicle categories exist and are active
- 0 vehicles in the database
- The `check-availability` function correctly finds no vehicles to show

## Solution

Migrate the 20 vehicles from the static data file to the database, assign them to appropriate categories, and link their images.

## Vehicle-to-Category Mapping

| Category | Vehicles |
|----------|----------|
| **Economy** | Honda Fit 2015, Toyota Corolla 2020 |
| **Compact Sedan** | VW Jetta 2015, VW Jetta 2019 (Blue), VW Jetta 2019 (Red), Honda Accord 2014 |
| **Mid-Size SUV** | Chevy Equinox 2020 (White), Chevy Equinox 2020 (Black), Subaru Forester 2017, VW Taos 2023, Jeep Renegade 2018, Honda CR-V 2019, Kia Soul 2021, Ford Edge 2017 |
| **Full-Size SUV** | Chevy Suburban 2017 |
| **Luxury** | Audi A4 2014, Audi A4 2022, Mercedes E350 2015, Audi Q5 2019, Audi Q5 2024 |
| **Van** | (none currently - can add later) |

## Implementation Steps

1. **Insert vehicles into database**
   - Add all 20 vehicles to the `vehicles` table
   - Set `category_id` based on vehicle type mapping
   - Set `status` to 'available'
   - Set `location` to match one of the pickup locations

2. **Upload vehicle images to storage**
   - Upload each vehicle's image to the `vehicle-images` bucket
   - Create entries in `vehicle_images` table linking images to vehicles

3. **Verify availability**
   - Test the categories page to confirm vehicles appear

## Technical Details

```text
Database inserts will use these category IDs:
┌──────────────┬──────────────────────────────────────┐
│ Category     │ ID                                   │
├──────────────┼──────────────────────────────────────┤
│ Economy      │ 9b40f231-bd61-4884-b181-12bd0d908780 │
│ Compact Sedan│ 7652dfc4-8e03-4e0b-b77e-4997ee6f964e │
│ Mid-Size SUV │ dd5efe8b-ab09-430b-88d8-046ce4ce32e0 │
│ Full-Size SUV│ 9ec6d0d8-ffc1-4843-803a-ca916d8ad638 │
│ Luxury       │ f45bcd56-f8dc-4118-bf91-4d869cde4ff8 │
│ Van          │ d7194ddf-5a8d-4452-99ab-5bf98ed4db8b │
└──────────────┴──────────────────────────────────────┘
```

Vehicle images will be uploaded to `vehicles/` folder in storage and referenced by public URLs in the `vehicle_images` table.

