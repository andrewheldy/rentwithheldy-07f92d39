

# Update Category Hero Images

Replace the placeholder category images with the new professionally-shot vehicle photos you've uploaded.

## Image Mapping

| Category | New Image |
|----------|-----------|
| Economy | Honda Civic (economy_car.jpg) |
| Compact Sedan | VW Jetta (sedan.webp) |
| Mid-Size SUV | Chevy Equinox (midsize_suv.png) |
| Luxury | Audi Q5 (luxury_suv.jpg) |
| Van | Ford Transit (passenger_van.jpg) |

**Note:** Full-Size SUV will keep its current image since no replacement was provided.

## Implementation Steps

1. **Upload images to storage**
   - Upload each of the 5 images to the `vehicle-images` storage bucket under the `categories/` folder
   - Files will be named to match their category slugs for consistency

2. **Update database records**
   - Update the `hero_image` column in `vehicle_categories` table for each of the 5 categories with the new public URLs

## Technical Details

Storage paths:
- `categories/economy.jpg`
- `categories/compact-sedan.webp`
- `categories/mid-size-suv.png`
- `categories/luxury.jpg`
- `categories/van.jpg`

