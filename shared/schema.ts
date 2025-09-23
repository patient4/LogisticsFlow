import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, pgEnum, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for status fields
export const orderStatusEnum = pgEnum("order_status", ["pending", "processing", "shipped", "delivered", "cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "processing", "failed"]);
export const driverStatusEnum = pgEnum("driver_status", ["available", "on_the_way", "loading", "waiting", "delivered"]);

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
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
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
  
  // Pickup information
  pickupAddress: text("pickup_address").notNull(),
  pickupDate: timestamp("pickup_date").notNull(),
  pickupTime: text("pickup_time"),
  
  // Delivery information
  deliveryAddress: text("delivery_address").notNull(),
  deliveryDate: timestamp("delivery_date").notNull(),
  deliveryTime: text("delivery_time"),
  
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
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  carrier: one(carriers, {
    fields: [drivers.carrierId],
    references: [carriers.id],
  }),
  orders: many(orders),
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
}));

export const orderTrackingEventsRelations = relations(orderTrackingEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderTrackingEvents.orderId],
    references: [orders.id],
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
