import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, pgEnum, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for status fields
export const orderStatusEnum = pgEnum("order_status", ["pending", "processing", "shipped", "in_transit", "delivered", "cancelled", "dispatched"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "processing", "failed"]);
export const driverStatusEnum = pgEnum("driver_status", ["available", "on_the_way", "loading", "waiting", "delivered"]);
export const dispatchStatusEnum = pgEnum("dispatch_status", ["pending", "heading_for_pickup", "at_pickup", "in_transit", "at_delivery", "delivered"]);
export const currencyEnum = pgEnum("currency", ["USD", "CAD", "EUR", "GBP"]);

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Carriers table
export const carriers = pgTable("carriers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  contactPerson: text("contact_person").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  mobile: text("mobile").notNull(),
  ratePerMile: decimal("rate_per_mile", { precision: 10, scale: 2 }),
  ratePerKm: decimal("rate_per_km", { precision: 10, scale: 2 }),
  defaultCurrency: currencyEnum("default_currency").notNull().default("USD"),
  serviceAreas: text("service_areas").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Drivers table
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  licenseNumber: text("license_number").notNull().unique(),
  carrierId: varchar("carrier_id").references(() => carriers.id),
  vehicleType: text("vehicle_type").notNull(),
  vehicleCapacity: decimal("vehicle_capacity", { precision: 10, scale: 2 }),
  currentStatus: driverStatusEnum("current_status").notNull().default("available"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  carrierId: varchar("carrier_id").references(() => carriers.id),
  driverId: varchar("driver_id").references(() => drivers.id),
  
  // Pickup information (single - for backward compatibility)
  pickupAddress: text("pickup_address").notNull(),
  pickupDate: timestamp("pickup_date").notNull(),
  pickupTime: text("pickup_time"),
  pickupPONumber: text("pickup_po_number"),
  
  // Multiple pickup locations (array of JSON objects)
  pickupLocations: text("pickup_locations").array(),
  
  // Delivery information (single - for backward compatibility)
  deliveryAddress: text("delivery_address").notNull(),
  deliveryDate: timestamp("delivery_date").notNull(),
  deliveryTime: text("delivery_time"),
  deliveryPONumber: text("delivery_po_number"),
  
  // Multiple delivery locations (array of JSON objects)
  deliveryLocations: text("delivery_locations").array(),
  
  // Package details
  numberOfPallets: integer("number_of_pallets").notNull().default(0),
  weight: decimal("weight", { precision: 10, scale: 2 }),
  dimensions: text("dimensions"), // JSON string for length, width, height
  
  // Financial
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  gstPercentage: decimal("gst_percentage", { precision: 5, scale: 2 }).default("0"),
  
  // Status tracking
  orderStatus: orderStatusEnum("order_status").notNull().default("pending"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dispatches table - links orders to carriers with dispatch-specific details
export const dispatches = pgTable("dispatches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dispatchNumber: text("dispatch_number").notNull().unique(),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  carrierId: varchar("carrier_id").references(() => carriers.id).notNull(),
  driverId: varchar("driver_id").references(() => drivers.id),
  
  // Dispatch-specific details
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("USD"),
  poNumber: text("po_number"),
  carrierMobile: text("carrier_mobile"), // editable copy of carrier mobile
  
  // Status and metadata
  dispatchStatus: dispatchStatusEnum("dispatch_status").notNull().default("pending"),
  notes: text("notes"),
  dispatchedAt: timestamp("dispatched_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order tracking events for history
export const orderTrackingEvents = pgTable("order_tracking_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  status: text("status").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  // Users don't have direct relations in this schema
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const carriersRelations = relations(carriers, ({ many }) => ({
  orders: many(orders),
  drivers: many(drivers),
  dispatches: many(dispatches),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  carrier: one(carriers, {
    fields: [drivers.carrierId],
    references: [carriers.id],
  }),
  orders: many(orders),
  dispatches: many(dispatches),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  carrier: one(carriers, {
    fields: [orders.carrierId],
    references: [carriers.id],
  }),
  driver: one(drivers, {
    fields: [orders.driverId],
    references: [drivers.id],
  }),
  trackingEvents: many(orderTrackingEvents),
  dispatches: many(dispatches),
}));

export const orderTrackingEventsRelations = relations(orderTrackingEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderTrackingEvents.orderId],
    references: [orders.id],
  }),
}));

export const dispatchesRelations = relations(dispatches, ({ one }) => ({
  order: one(orders, {
    fields: [dispatches.orderId],
    references: [orders.id],
  }),
  carrier: one(carriers, {
    fields: [dispatches.carrierId],
    references: [carriers.id],
  }),
  driver: one(drivers, {
    fields: [dispatches.driverId],
    references: [drivers.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertCarrierSchema = createInsertSchema(carriers).omit({
  id: true,
  createdAt: true,
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderTrackingEventSchema = createInsertSchema(orderTrackingEvents).omit({
  id: true,
  createdAt: true,
});

export const insertDispatchSchema = createInsertSchema(dispatches).omit({
  id: true,
  dispatchNumber: true,
  dispatchedAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertCarrier = z.infer<typeof insertCarrierSchema>;
export type Carrier = typeof carriers.$inferSelect;

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderTrackingEvent = z.infer<typeof insertOrderTrackingEventSchema>;
export type OrderTrackingEvent = typeof orderTrackingEvents.$inferSelect;

export type InsertDispatch = z.infer<typeof insertDispatchSchema>;
export type Dispatch = typeof dispatches.$inferSelect;
