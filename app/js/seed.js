export const APP_VERSION = 1;

export const SETTINGS = {
  dayStartHour: 5,
  dayDurationHours: 17,
};

export const DRIVERS = [
  { id: "d1", name: "Driver 1", color: "#0891b2" },
  { id: "d2", name: "Driver 2", color: "#0e7490" },
  { id: "d3", name: "Driver 3", color: "#0369a1" },
  { id: "d4", name: "Driver 4", color: "#0f766e" },
  { id: "d5", name: "Driver 5", color: "#1d4ed8" },
];

function usualFromMonthly(monthly) {
  return Math.max(1, Math.round(monthly / 26));
}

const RAW = [
  { name: "Punjab National Bank Ltd", monthly: 205, driverId: "d1" },
  { name: "Tata AIG General Insurance", monthly: 35, driverId: "d1" },
  { name: "HDFC Life Insurance Ltd", monthly: 24, driverId: "d1" },
  { name: "UTI", monthly: 20, driverId: "d1" },
  { name: "Geojit Financial Services Ltd", monthly: 14, driverId: "d1" },
  { name: "Deogiri Nagari Sahakari Bank", monthly: 25, driverId: "d1" },
  { name: "Indian Bank", monthly: 25, driverId: "d1" },
  { name: "ICICI Lombard", monthly: 38, driverId: "d1" },
  { name: "Nasik Merchant Co-op Bank", monthly: 25, driverId: "d1" },
  { name: "Vijay Laxmi Urban Co-op Bank", monthly: 14, driverId: "d1" },
  { name: "Jalgaon Janata Bank — Ramanand Nagar", monthly: 50, driverId: "d1" },
  { name: "Sundaram Finance", monthly: 55, driverId: "d1" },

  { name: "D.B. Corporation Ltd", monthly: 220, driverId: "d2" },
  { name: "My FM D.B. Corp Ltd", monthly: 54, driverId: "d2" },
  { name: "Dainik Deshdoot (Shrirang Prakashan)", monthly: 85, driverId: "d2" },
  { name: "Sakal Media Private Limited", monthly: 57, driverId: "d2" },
  { name: "Dainik Deshonnati", monthly: 54, driverId: "d2" },
  { name: "Shree Ambika Printers & Publications", monthly: 81, driverId: "d2" },
  { name: "Aakar Digital", monthly: 14, driverId: "d2" },
  { name: "Aakar Photo – 2", monthly: 27, driverId: "d2" },
  { name: "Updater Services", monthly: 33, driverId: "d2" },
  { name: "Sustainable Agro Commercial Finance", monthly: 54, driverId: "d2" },

  { name: "Karyakari Abhiyanta, Laghu Pathbandhare", monthly: 87, driverId: "d3" },
  { name: "Hon. Judge, Labour Court", monthly: 25, driverId: "d3" },
  { name: "Sahayak Sanchalak, Sarkari Abhiyokta", monthly: 24, driverId: "d3" },
  { name: "Jilha Vyavasthapak (Ma.Fu.Ma.Vi.M)", monthly: 23, driverId: "d3" },
  { name: "Jilha Sainik Kalyan Karyalay", monthly: 30, driverId: "d3" },
  { name: "Pachora Peoples Co-op", monthly: 24, driverId: "d3" },
  { name: "Subhash Chowk Urban Co-op Society", monthly: 37, driverId: "d3" },
  { name: "Adv. Sanjay Rane", monthly: 22, driverId: "d3" },
  { name: "Mahavir Civil Engineering", monthly: 52, driverId: "d3" },
  { name: "Siddharth Infratech Pvt Ltd", monthly: 39, driverId: "d3" },
  { name: "Cosmo Enterprises", monthly: 27, driverId: "d3" },
  { name: "Nitin M Patil", monthly: 25, driverId: "d3" },

  { name: "Cat Enterprises", monthly: 31, driverId: "d4" },
  { name: "Cat Enterprises 2", monthly: 31, driverId: "d4" },
  { name: "Herbimade Remedies", monthly: 27, driverId: "d4" },
  { name: "Novel Seeds Pvt Ltd", monthly: 27, driverId: "d4" },
  { name: "Nirmal Seeds", monthly: 26, driverId: "d4" },
  { name: "Bharat Dairy", monthly: 39, driverId: "d4" },
  { name: "Bhakti Farma", monthly: 14, driverId: "d4" },
  { name: "Lotus Laboratory", monthly: 27, driverId: "d4" },
  { name: "Popular Tyres", monthly: 27, driverId: "d4" },
  { name: "Bafna Tyres", monthly: 27, driverId: "d4" },
  { name: "Ramesh Motor Driving School 1", monthly: 54, driverId: "d4" },
  { name: "Ramesh Motor Driving School 2", monthly: 54, driverId: "d4" },

  { name: "Black Berry", monthly: 31, driverId: "d5" },
  { name: "Mahadev Furnishing", monthly: 22, driverId: "d5" },
  { name: "Vinod Agencies", monthly: 10, driverId: "d5" },
  { name: "Vinod Mens Wear", monthly: 45, driverId: "d5" },
  { name: "Vinod Kids Wear Collection", monthly: 14, driverId: "d5" },
  { name: "Vinod Sadiya", monthly: 9, driverId: "d5" },
  { name: "J K Pan Center", monthly: 27, driverId: "d5" },
  { name: "Vaibhav Kotkar", monthly: 27, driverId: "d5" },
  { name: "Pritesh Patil", monthly: 23, driverId: "d5" },
  { name: "Jitendra Conversing", monthly: 27, driverId: "d5" },
  { name: "Courian", monthly: 5, driverId: "d5" },
];

export const CUSTOMERS = RAW.map((c, i) => ({
  id: `c${String(i + 1).padStart(3, "0")}`,
  name: c.name,
  driverId: c.driverId,
  monthlyJars: c.monthly,
  usualJars: usualFromMonthly(c.monthly),
  routeOrder: i,
  active: true,
}));
