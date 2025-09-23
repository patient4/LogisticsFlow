import { db } from "./db";
import { customers, carriers, drivers, orders, users, orderTrackingEvents } from "@shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Create admin user
    console.log("👤 Creating admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db.insert(users).values({
      username: "admin",
      email: "admin@logistics.com",
      password: hashedPassword,
      role: "admin",
    }).returning();

    // Create customers
    console.log("🏢 Creating customers...");
    const customerData = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1-555-0101",
        address: "123 Main Street",
        city: "New York",
        country: "USA",
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+1-555-0102",
        address: "456 Oak Avenue",
        city: "Los Angeles",
        country: "USA",
      },
      {
        name: "Acme Corporation",
        email: "orders@acme.com",
        phone: "+1-555-0103",
        address: "789 Business Boulevard",
        city: "Chicago",
        country: "USA",
      },
      {
        name: "Global Imports Ltd",
        email: "logistics@globalimports.com",
        phone: "+1-555-0104",
        address: "321 Industrial Way",
        city: "Houston",
        country: "USA",
      },
    ];
    
    const createdCustomers = await db.insert(customers).values(customerData).returning();

    // Create carriers
    console.log("🚛 Creating carriers...");
    const carrierData = [
      {
        name: "FedEx",
        code: "FEDEX",
        contactEmail: "dispatch@fedex.com",
        contactPhone: "+1-800-GO-FEDEX",
        serviceAreas: ["USA", "Canada", "Mexico"],
        isActive: true,
      },
      {
        name: "UPS",
        code: "UPS",
        contactEmail: "shipping@ups.com",
        contactPhone: "+1-800-PICK-UPS",
        serviceAreas: ["USA", "Canada", "International"],
        isActive: true,
      },
      {
        name: "DHL",
        code: "DHL",
        contactEmail: "support@dhl.com",
        contactPhone: "+1-800-CALL-DHL",
        serviceAreas: ["International", "USA", "Europe"],
        isActive: true,
      },
    ];
    
    const createdCarriers = await db.insert(carriers).values(carrierData).returning();

    // Create drivers
    console.log("👨‍✈️ Creating drivers...");
    const driverData = [
      {
        name: "John Doe",
        phone: "+1-555-1001",
        licenseNumber: "DL-001-2024",
        carrierId: createdCarriers[0].id, // FedEx
        vehicleType: "Heavy Duty Truck",
        vehicleCapacity: "40000.00",
        currentStatus: "on_the_way" as const,
        isActive: true,
      },
      {
        name: "Jane Smith",
        phone: "+1-555-1002",
        licenseNumber: "DL-002-2024",
        carrierId: createdCarriers[0].id, // FedEx
        vehicleType: "Van",
        vehicleCapacity: "3500.00",
        currentStatus: "loading" as const,
        isActive: true,
      },
      {
        name: "Mike Johnson",
        phone: "+1-555-1003",
        licenseNumber: "DL-003-2024",
        carrierId: createdCarriers[1].id, // UPS
        vehicleType: "Medium Truck",
        vehicleCapacity: "20000.00",
        currentStatus: "waiting" as const,
        isActive: true,
      },
      {
        name: "Emily Davis",
        phone: "+1-555-1004",
        licenseNumber: "DL-004-2024",
        carrierId: createdCarriers[1].id, // UPS
        vehicleType: "Small Truck",
        vehicleCapacity: "10000.00",
        currentStatus: "on_the_way" as const,
        isActive: true,
      },
      {
        name: "Chris Lee",
        phone: "+1-555-1005",
        licenseNumber: "DL-005-2024",
        carrierId: createdCarriers[2].id, // DHL
        vehicleType: "Heavy Duty Truck",
        vehicleCapacity: "45000.00",
        currentStatus: "delivered" as const,
        isActive: true,
      },
    ];
    
    const createdDrivers = await db.insert(drivers).values(driverData).returning();

    // Create orders
    console.log("📦 Creating orders...");
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orderData = [
      {
        orderNumber: "ORD-001-2024",
        customerId: createdCustomers[0].id,
        carrierId: createdCarriers[0].id,
        driverId: createdDrivers[0].id,
        pickupAddress: "123 Main Street, New York, USA",
        pickupDate: now,
        pickupTime: "09:00",
        deliveryAddress: "456 Delivery Lane, Boston, USA",
        deliveryDate: tomorrow,
        deliveryTime: "14:00",
        numberOfPallets: 2,
        weight: "1500.50",
        dimensions: JSON.stringify({ length: 48, width: 40, height: 48 }),
        amount: "250.00",
        gstPercentage: "8.50",
        orderStatus: "shipped" as const,
        paymentStatus: "pending" as const,
        notes: "Handle with care - fragile items",
      },
      {
        orderNumber: "ORD-002-2024",
        customerId: createdCustomers[1].id,
        carrierId: createdCarriers[0].id,
        driverId: createdDrivers[1].id,
        pickupAddress: "456 Oak Avenue, Los Angeles, USA",
        pickupDate: now,
        pickupTime: "10:30",
        deliveryAddress: "789 Destination Street, San Francisco, USA",
        deliveryDate: tomorrow,
        deliveryTime: "16:00",
        numberOfPallets: 1,
        weight: "800.00",
        dimensions: JSON.stringify({ length: 24, width: 24, height: 24 }),
        amount: "150.00",
        gstPercentage: "8.50",
        orderStatus: "processing" as const,
        paymentStatus: "paid" as const,
        notes: "Standard delivery",
      },
      {
        orderNumber: "ORD-003-2024",
        customerId: createdCustomers[2].id,
        carrierId: createdCarriers[1].id,
        driverId: createdDrivers[2].id,
        pickupAddress: "789 Business Boulevard, Chicago, USA",
        pickupDate: now,
        pickupTime: "08:00",
        deliveryAddress: "321 Corporate Center, Detroit, USA",
        deliveryDate: tomorrow,
        deliveryTime: "13:00",
        numberOfPallets: 5,
        weight: "3200.75",
        dimensions: JSON.stringify({ length: 60, width: 48, height: 60 }),
        amount: "450.00",
        gstPercentage: "8.50",
        orderStatus: "shipped" as const,
        paymentStatus: "pending" as const,
        notes: "Business delivery - dock access required",
      },
      {
        orderNumber: "ORD-004-2024",
        customerId: createdCustomers[3].id,
        carrierId: createdCarriers[1].id,
        driverId: createdDrivers[3].id,
        pickupAddress: "321 Industrial Way, Houston, USA",
        pickupDate: now,
        pickupTime: "11:00",
        deliveryAddress: "654 Warehouse District, Dallas, USA",
        deliveryDate: tomorrow,
        deliveryTime: "15:30",
        numberOfPallets: 3,
        weight: "2100.25",
        dimensions: JSON.stringify({ length: 48, width: 36, height: 42 }),
        amount: "320.00",
        gstPercentage: "8.50",
        orderStatus: "processing" as const,
        paymentStatus: "paid" as const,
        notes: "Industrial equipment - requires special handling",
      },
      {
        orderNumber: "ORD-005-2024",
        customerId: createdCustomers[0].id,
        carrierId: createdCarriers[2].id,
        driverId: createdDrivers[4].id,
        pickupAddress: "123 Main Street, New York, USA",
        pickupDate: now,
        pickupTime: "07:30",
        deliveryAddress: "987 Final Destination, Miami, USA",
        deliveryDate: tomorrow,
        deliveryTime: "17:00",
        numberOfPallets: 1,
        weight: "500.00",
        dimensions: JSON.stringify({ length: 30, width: 30, height: 30 }),
        amount: "180.00",
        gstPercentage: "8.50",
        orderStatus: "delivered" as const,
        paymentStatus: "paid" as const,
        notes: "Express delivery completed",
      },
      {
        orderNumber: "ORD-006-2024",
        customerId: createdCustomers[1].id,
        carrierId: createdCarriers[0].id,
        driverId: null,
        pickupAddress: "456 Oak Avenue, Los Angeles, USA",
        pickupDate: tomorrow,
        pickupTime: "09:30",
        deliveryAddress: "111 Pending Street, Seattle, USA",
        deliveryDate: tomorrow,
        deliveryTime: "18:00",
        numberOfPallets: 2,
        weight: "1200.00",
        dimensions: JSON.stringify({ length: 36, width: 36, height: 36 }),
        amount: "280.00",
        gstPercentage: "8.50",
        orderStatus: "pending" as const,
        paymentStatus: "pending" as const,
        notes: "Awaiting driver assignment",
      },
      {
        orderNumber: "ORD-007-2024",
        customerId: createdCustomers[2].id,
        carrierId: createdCarriers[2].id,
        driverId: null,
        pickupAddress: "789 Business Boulevard, Chicago, USA",
        pickupDate: tomorrow,
        pickupTime: "12:00",
        deliveryAddress: "222 Future Lane, Phoenix, USA",
        deliveryDate: tomorrow,
        deliveryTime: "19:00",
        numberOfPallets: 4,
        weight: "2800.50",
        dimensions: JSON.stringify({ length: 54, width: 42, height: 48 }),
        amount: "380.00",
        gstPercentage: "8.50",
        orderStatus: "pending" as const,
        paymentStatus: "pending" as const,
        notes: "Large shipment - multiple pallets",
      },
    ];
    
    const createdOrders = await db.insert(orders).values(orderData).returning();

    // Create tracking events for orders
    console.log("📍 Creating tracking events...");
    const trackingEvents = [
      // Events for first order (shipped)
      {
        orderId: createdOrders[0].id,
        status: "pending",
        description: "Order created and awaiting pickup",
        location: "New York, USA",
      },
      {
        orderId: createdOrders[0].id,
        status: "picked_up",
        description: "Package picked up by driver",
        location: "New York, USA",
      },
      {
        orderId: createdOrders[0].id,
        status: "in_transit",
        description: "Package is on the way to destination",
        location: "En route to Boston",
      },
      
      // Events for second order (processing)
      {
        orderId: createdOrders[1].id,
        status: "pending",
        description: "Order received and being processed",
        location: "Los Angeles, USA",
      },
      {
        orderId: createdOrders[1].id,
        status: "processing",
        description: "Package prepared for pickup",
        location: "Los Angeles, USA",
      },
      
      // Events for third order (shipped)
      {
        orderId: createdOrders[2].id,
        status: "pending",
        description: "Business order created",
        location: "Chicago, USA",
      },
      {
        orderId: createdOrders[2].id,
        status: "shipped",
        description: "Package shipped via business route",
        location: "Chicago, USA",
      },
      
      // Events for delivered order
      {
        orderId: createdOrders[4].id,
        status: "pending",
        description: "Express order created",
        location: "New York, USA",
      },
      {
        orderId: createdOrders[4].id,
        status: "picked_up",
        description: "Express pickup completed",
        location: "New York, USA",
      },
      {
        orderId: createdOrders[4].id,
        status: "delivered",
        description: "Package successfully delivered",
        location: "Miami, USA",
      },
    ];
    
    await db.insert(orderTrackingEvents).values(trackingEvents);

    console.log("✅ Database seeded successfully!");
    console.log(`📊 Created:`);
    console.log(`   - 1 admin user (admin@logistics.com / admin123)`);
    console.log(`   - ${createdCustomers.length} customers`);
    console.log(`   - ${createdCarriers.length} carriers`);
    console.log(`   - ${createdDrivers.length} drivers`);
    console.log(`   - ${createdOrders.length} orders`);
    console.log(`   - ${trackingEvents.length} tracking events`);
    
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      console.log("🎉 Seed completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seed failed:", error);
      process.exit(1);
    });
}

export { seed };