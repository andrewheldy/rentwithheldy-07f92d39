// Vehicle image imports
import audi2014 from "@/assets/vehicles/2014_AUDI_A4.png";
import accord2014 from "@/assets/vehicles/2014_HONDA_ACCORD.avif";
import fit2015 from "@/assets/vehicles/2015_HONDA_FIT.avif";
import merc2015 from "@/assets/vehicles/2015_MERC_E350.avif";
import jetta2015 from "@/assets/vehicles/2015_VW_JETTA.avif";
import forester2017 from "@/assets/vehicles/2017_SUBARU_FORESTER.avif";
import suburban2017 from "@/assets/vehicles/2017_SUBURBAN.avif";
import renegade2018 from "@/assets/vehicles/2018_Jeep_Renegade.avif";
import jettaBlue2019 from "@/assets/vehicles/2019_BLUE_JETTA.avif";
import jettaRed2019 from "@/assets/vehicles/2019_RED_JETTA.avif";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  rating: number;
  trips: number;
  hostType: string;
  dailyRate: number;
  images: string[];
  description: string;
  features: string[];
  // Admin-only fields (not displayed on public listing)
  vin?: string;
  licensePlate?: string;
  initialMileage?: number;
  dateAdded?: string;
}

export const vehicles: Vehicle[] = [
  {
    id: "vw-jetta-2019-1",
    make: "Volkswagen",
    model: "Jetta",
    year: 2019,
    color: "Blue",
    rating: 5.0,
    trips: 4,
    hostType: "All-Star Host",
    dailyRate: 45,
    images: [jettaBlue2019],
    description: "Comfortable and fuel-efficient sedan perfect for city driving and short trips.",
    features: ["Fuel Efficient", "Bluetooth", "Air Conditioning", "Backup Camera"]
  },
  {
    id: "chevrolet-equinox-2020",
    make: "Chevrolet",
    model: "Equinox",
    year: 2020,
    color: "White",
    rating: 5.0,
    trips: 7,
    hostType: "All-Star Host",
    dailyRate: 55,
    images: [
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop"
    ],
    description: "Spacious SUV ideal for family trips and adventures around South Florida.",
    features: ["Spacious Interior", "Safety Features", "Apple CarPlay", "All-Wheel Drive"]
  },
  {
    id: "toyota-corolla-2020",
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    color: "Blue",
    rating: 5.0,
    trips: 6,
    hostType: "All-Star Host",
    dailyRate: 42,
    images: [
      "https://images.unsplash.com/photo-1623869675781-80aa31012ca1?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&h=600&fit=crop"
    ],
    description: "Reliable and economical compact car with excellent fuel efficiency.",
    features: ["Excellent MPG", "Lane Departure Warning", "Pre-Collision System", "Toyota Safety Sense"]
  },
  {
    id: "chevrolet-suburban-2017",
    make: "Chevrolet",
    model: "Suburban",
    year: 2017,
    color: "Black",
    rating: 5.0,
    trips: 1,
    hostType: "All-Star Host",
    dailyRate: 85,
    images: [suburban2017],
    description: "Large SUV perfect for group travel and special occasions with premium comfort.",
    features: ["Seats 8", "Premium Sound", "Third Row Seating", "Towing Capacity"]
  },
  {
    id: "vw-jetta-2015",
    make: "Volkswagen",
    model: "Jetta",
    year: 2015,
    color: "Silver",
    rating: 4.8,
    trips: 12,
    hostType: "All-Star Host",
    dailyRate: 40,
    images: [jetta2015],
    description: "Well-maintained sedan with German engineering and reliability.",
    features: ["German Engineering", "Comfortable Seating", "Good Trunk Space", "Manual Transmission"]
  },
  {
    id: "audi-a4-2022",
    make: "Audi",
    model: "A4",
    year: 2022,
    color: "Black",
    rating: 5.0,
    trips: 14,
    hostType: "All-Star Host",
    dailyRate: 75,
    images: [
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop"
    ],
    description: "Luxury sedan with cutting-edge technology and premium comfort features.",
    features: ["Luxury Interior", "Quattro AWD", "Virtual Cockpit", "Premium Sound"]
  },
  {
    id: "honda-fit-2015",
    make: "Honda",
    model: "Fit",
    year: 2015,
    color: "Gray",
    rating: 5.0,
    trips: 3,
    hostType: "All-Star Host",
    dailyRate: 38,
    images: [fit2015],
    description: "Compact and versatile hatchback perfect for navigating Miami's busy streets.",
    features: ["Compact Size", "Great for City", "Versatile Storage", "Easy Parking"]
  },
  {
    id: "vw-jetta-2019-2",
    make: "Volkswagen",
    model: "Jetta",
    year: 2019,
    color: "Red",
    rating: 5.0,
    trips: 13,
    hostType: "All-Star Host",
    dailyRate: 45,
    images: [jettaRed2019],
    description: "Sporty red Jetta with modern features and comfortable interior.",
    features: ["Sporty Design", "Modern Tech", "Comfortable Interior", "Great Value"]
  },
  {
    id: "kia-soul-2021",
    make: "Kia",
    model: "Soul",
    year: 2021,
    color: "Blue",
    rating: 5.0,
    trips: 9,
    hostType: "All-Star Host",
    dailyRate: 50,
    images: [
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&h=600&fit=crop"
    ],
    description: "Unique and fun crossover with distinctive styling and practical features.",
    features: ["Unique Design", "Spacious Interior", "Tech Features", "Great Visibility"]
  },
  {
    id: "mercedes-e350-2015",
    make: "Mercedes-Benz",
    model: "E350",
    year: 2015,
    color: "Black",
    rating: 4.67,
    trips: 4,
    hostType: "All-Star Host",
    dailyRate: 90,
    images: [merc2015],
    description: "Premium luxury sedan with sophisticated styling and advanced technology.",
    features: ["Luxury Comfort", "Advanced Safety", "Premium Materials", "Smooth Ride"]
  },
  {
    id: "honda-accord-2014",
    make: "Honda",
    model: "Accord",
    year: 2014,
    color: "Silver",
    rating: 5.0,
    trips: 5,
    hostType: "All-Star Host",
    dailyRate: 48,
    images: [accord2014],
    description: "Reliable midsize sedan known for Honda's quality and dependability.",
    features: ["Honda Reliability", "Spacious Cabin", "Good Fuel Economy", "Proven Performance"]
  },
  {
    id: "audi-q5-2024",
    make: "Audi",
    model: "Q5",
    year: 2024,
    color: "Gray",
    rating: 4.94,
    trips: 19,
    hostType: "All-Star Host",
    dailyRate: 95,
    images: [
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop"
    ],
    description: "Latest luxury SUV with cutting-edge technology and premium performance.",
    features: ["Latest Tech", "Luxury SUV", "Quattro AWD", "Premium Interior"]
  },
  {
    id: "vw-taos-2023",
    make: "Volkswagen",
    model: "Taos",
    year: 2023,
    color: "Blue",
    rating: 4.97,
    trips: 42,
    hostType: "All-Star Host",
    dailyRate: 58,
    images: [
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop"
    ],
    description: "Compact SUV with modern design and versatile capabilities for any adventure.",
    features: ["Compact SUV", "Modern Design", "Versatile", "Good Value"]
  },
  {
    id: "ford-edge-2017",
    make: "Ford",
    model: "Edge",
    year: 2017,
    color: "Burgundy",
    rating: 5.0,
    trips: 33,
    hostType: "All-Star Host",
    dailyRate: 52,
    images: [
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop"
    ],
    description: "Midsize SUV with bold styling and comfortable seating for all passengers.",
    features: ["Midsize SUV", "Comfortable Seating", "Bold Styling", "Good Performance"]
  },
  {
    id: "audi-a4-2014",
    make: "Audi",
    model: "A4",
    year: 2014,
    color: "Black",
    rating: 4.97,
    trips: 39,
    hostType: "All-Star Host",
    dailyRate: 65,
    images: [audi2014],
    description: "Well-maintained luxury sedan with timeless German engineering excellence.",
    features: ["German Luxury", "Timeless Design", "Well Maintained", "Proven Reliability"]
  },
  {
    id: "subaru-forester-2017",
    make: "Subaru",
    model: "Forester",
    year: 2017,
    color: "White",
    rating: 4.92,
    trips: 28,
    hostType: "All-Star Host",
    dailyRate: 55,
    images: [forester2017],
    description: "Adventure-ready SUV with all-wheel drive and excellent safety ratings.",
    features: ["All-Wheel Drive", "Adventure Ready", "Excellent Safety", "Reliable"]
  },
  {
    id: "audi-q5-2019",
    make: "Audi",
    model: "Q5",
    year: 2019,
    color: "Silver",
    rating: 5.0,
    trips: 17,
    hostType: "All-Star Host",
    dailyRate: 80,
    images: [
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop"
    ],
    description: "Premium luxury SUV combining performance, comfort, and advanced technology.",
    features: ["Premium Luxury", "Performance", "Advanced Tech", "Comfort"]
  },
  {
    id: "jeep-renegade-2018",
    make: "Jeep",
    model: "Renegade",
    year: 2018,
    color: "Orange",
    rating: 4.8,
    trips: 0,
    hostType: "All-Star Host",
    dailyRate: 48,
    images: [renegade2018],
    description: "Fun and capable compact SUV with iconic Jeep styling and off-road capability.",
    features: ["Compact SUV", "Off-Road Capable", "Iconic Styling", "Fun to Drive"]
  }
];
