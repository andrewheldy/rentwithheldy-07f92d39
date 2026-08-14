import transit2018DoorOpen from "@/assets/passenger-vans/2018-transit-350-door-open.jpg";
import transit2018PassengerSide from "@/assets/passenger-vans/2018-transit-350-passenger-side.jpg";
import transit2018RearOpen from "@/assets/passenger-vans/2018-transit-350-rear-open.jpg";
import transit2018Seating from "@/assets/passenger-vans/2018-transit-350-seating.jpg";
import transit2018Cockpit from "@/assets/passenger-vans/2018-transit-350-cockpit.jpg";
import transit2024Front from "@/assets/passenger-vans/2024-transit-350hd-front.jpg";
import transit2024Side from "@/assets/passenger-vans/2024-transit-350hd-side.jpg";
import transit2024Rear from "@/assets/passenger-vans/2024-transit-350hd-rear.jpg";
import transit2024Seating from "@/assets/passenger-vans/2024-transit-350hd-seating.jpg";
import transit2024Cockpit from "@/assets/passenger-vans/2024-transit-350hd-cockpit.jpg";

export interface PassengerVan {
  id: "2018-transit-350" | "2024-transit-350-hd";
  year: number;
  name: string;
  capacity: number;
  premium: boolean;
  translationKey: "transit2018" | "transit2024";
  images: string[];
}

export const PASSENGER_VANS: PassengerVan[] = [
  {
    id: "2018-transit-350",
    year: 2018,
    name: "Ford Transit 350",
    capacity: 14,
    premium: false,
    translationKey: "transit2018",
    images: [
      transit2018DoorOpen,
      transit2018PassengerSide,
      transit2018RearOpen,
      transit2018Seating,
      transit2018Cockpit,
    ],
  },
  {
    id: "2024-transit-350-hd",
    year: 2024,
    name: "Ford Transit 350 HD",
    capacity: 14,
    premium: true,
    translationKey: "transit2024",
    images: [
      transit2024Front,
      transit2024Side,
      transit2024Rear,
      transit2024Seating,
      transit2024Cockpit,
    ],
  },
];

export const PASSENGER_VAN_HERO_IMAGE = transit2024Front;
