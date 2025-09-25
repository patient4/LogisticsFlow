// From blueprint:javascript_database integration
import { 
  users, customers, carriers, drivers, orders, orderTrackingEvents, dispatches,
  type User, type InsertUser,
  type Customer, type InsertCustomer,
  type Carrier, type InsertCarrier,
  type Driver, type InsertDriver,
  type Order, type InsertOrder,
  type OrderTrackingEvent, type InsertOrderTrackingEvent,
  type Dispatch, type InsertDispatch
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and, or, count, sql, ilike } from "drizzle-orm";
import bcrypt from "bcrypt";

// Enhanced storage interface with all CRUD operations needed
export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Customer management
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomers(limit?: number, offset?: number): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  searchCustomers(query: string): Promise<Customer[]>;
  
  // Carrier management
  getCarrier(id: string): Promise<Carrier | undefined>;
  getCarriers(limit?: number, offset?: number): Promise<Carrier[]>;
  createCarrier(carrier: InsertCarrier): Promise<Carrier>;
  updateCarrier(id: string, carrier: Partial<InsertCarrier>): Promise<Carrier | undefined>;
  deleteCarrier(id: string): Promise<boolean>;
  
  // Driver management
  getDriver(id: string): Promise<Driver | undefined>;
  getDrivers(limit?: number, offset?: number): Promise<Driver[]>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  updateDriverStatus(id: string, status: string): Promise<Driver | undefined>;
  getDriversByCarrier(carrierId: string): Promise<Driver[]>;
  
  // Order management
  getOrder(id: string): Promise<(Order & { customer: Customer; carrier?: Carrier; driver?: Driver }) | undefined>;
  getOrders(limit?: number, offset?: number): Promise<(Order & { customer: Customer; carrier?: Carrier; driver?: Driver })[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  searchOrders(query: string): Promise<(Order & { customer: Customer; carrier?: Carrier; driver?: Driver })[]>;
  getOrdersByStatus(status: string): Promise<(Order & { customer: Customer; carrier?: Carrier; driver?: Driver })[]>;
  assignOrderToDriver(orderId: string, driverId: string): Promise<Order | undefined>;
  
  // Order tracking
  addOrderTrackingEvent(event: InsertOrderTrackingEvent): Promise<OrderTrackingEvent>;
  getOrderTrackingEvents(orderId: string): Promise<OrderTrackingEvent[]>;
  
  // Dispatch management
  createDispatch(dispatch: InsertDispatch): Promise<Dispatch>;
  getDispatch(id: string): Promise<Dispatch | undefined>;
  getDispatches(limit?: number, offset?: number): Promise<Dispatch[]>;
  getDispatchesByOrder(orderId: string): Promise<Dispatch[]>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    totalInTransit: number;
    totalRevenue: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  // Customer methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomers(limit = 50, offset = 0): Promise<Customer[]> {
    return db.select().from(customers).limit(limit).offset(offset).orderBy(desc(customers.createdAt));
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return updated || undefined;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return (result.rowCount || 0) > 0;
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    return db.select().from(customers)
      .where(
        or(
          like(customers.name, `%${query}%`),
          like(customers.email, `%${query}%`),
          like(customers.phone, `%${query}%`)
        )
      );
  }

  // Carrier methods
  async getCarrier(id: string): Promise<Carrier | undefined> {
    const [carrier] = await db.select().from(carriers).where(eq(carriers.id, id));
    return carrier || undefined;
  }

  async getCarriers(limit = 50, offset = 0): Promise<Carrier[]> {
    return db.select().from(carriers).limit(limit).offset(offset).orderBy(desc(carriers.createdAt));
  }

  async createCarrier(carrier: InsertCarrier): Promise<Carrier> {
    const [newCarrier] = await db.insert(carriers).values(carrier).returning();
    return newCarrier;
  }

  async updateCarrier(id: string, carrier: Partial<InsertCarrier>): Promise<Carrier | undefined> {
    const [updated] = await db.update(carriers).set(carrier).where(eq(carriers.id, id)).returning();
    return updated || undefined;
  }

  async deleteCarrier(id: string): Promise<boolean> {
    const result = await db.delete(carriers).where(eq(carriers.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Driver methods
  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver || undefined;
  }

  async getDrivers(limit = 50, offset = 0): Promise<Driver[]> {
    return db.select().from(drivers).limit(limit).offset(offset).orderBy(desc(drivers.createdAt));
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const [newDriver] = await db.insert(drivers).values(driver).returning();
    return newDriver;
  }

  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined> {
    const [updated] = await db.update(drivers).set(driver).where(eq(drivers.id, id)).returning();
    return updated || undefined;
  }

  async updateDriverStatus(id: string, status: "available" | "on_the_way" | "loading" | "waiting" | "delivered"): Promise<Driver | undefined> {
    const [updated] = await db.update(drivers)
      .set({ currentStatus: status })
      .where(eq(drivers.id, id))
      .returning();
    return updated || undefined;
  }

  async getDriversByCarrier(carrierId: string): Promise<Driver[]> {
    return db.select().from(drivers).where(eq(drivers.carrierId, carrierId));
  }

  // Order methods
  async getOrder(id: string): Promise<(Order & { customer: Customer; carrier?: Carrier; driver?: Driver }) | undefined> {
    const result = await db.select({
      order: orders,
      customer: customers,
      carrier: carriers,
      driver: drivers,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(carriers, eq(orders.carrierId, carriers.id))
    .leftJoin(drivers, eq(orders.driverId, drivers.id))
    .where(eq(orders.id, id));

    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      ...row.order,
      customer: row.customer!,
      carrier: row.carrier || undefined,
      driver: row.driver || undefined,
    } as any;
  }

  async getOrders(limit = 50, offset = 0): Promise<(Order & { customer: Customer; carrier?: Carrier; driver?: Driver })[]> {
    const result = await db.select({
      order: orders,
      customer: customers,
      carrier: carriers,
      driver: drivers,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(carriers, eq(orders.carrierId, carriers.id))
    .leftJoin(drivers, eq(orders.driverId, drivers.id))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(orders.createdAt));

    return result.map(row => ({
      ...row.order,
      customer: row.customer!,
      carrier: row.carrier || undefined,
      driver: row.driver || undefined,
    })) as any;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    // Generate order number
    const timestamp = Date.now();
    const orderNumber = `ORD-${timestamp}`;
    
    const [newOrder] = await db.insert(orders)
      .values({ ...order, orderNumber })
      .returning();
    return newOrder;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteOrder(id: string): Promise<boolean> {
    try {
      // First, delete all related tracking events
      await db.delete(orderTrackingEvents).where(eq(orderTrackingEvents.orderId, id));
      
      // Then delete the order
      const result = await db.delete(orders).where(eq(orders.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error; // Re-throw so the API route can handle it properly
    }
  }

  async searchOrders(query: string): Promise<(Order & { customer: Customer; carrier?: Carrier; driver?: Driver })[]> {
    const searchTerm = `%${query}%`;
    const fuzzyThreshold = 0.3; // Minimum similarity score for trigram matching
    
    const result = await db.select({
      order: orders,
      customer: customers,
      carrier: carriers,
      driver: drivers,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(carriers, eq(orders.carrierId, carriers.id))
    .leftJoin(drivers, eq(orders.driverId, drivers.id))
    .where(
      or(
        // ILIKE searches for exact substring matches (case-insensitive)
        ilike(orders.orderNumber, searchTerm),
        ilike(customers.name, searchTerm),
        ilike(orders.pickupPONumber, searchTerm),
        ilike(orders.deliveryPONumber, searchTerm),
        ilike(orders.pickupAddress, searchTerm),
        ilike(orders.deliveryAddress, searchTerm),
        
        // Trigram similarity searches for fuzzy matches
        sql`SIMILARITY(${orders.orderNumber}, ${query}) > ${fuzzyThreshold}`,
        sql`SIMILARITY(${customers.name}, ${query}) > ${fuzzyThreshold}`,
        sql`SIMILARITY(${orders.pickupPONumber}, ${query}) > ${fuzzyThreshold}`,
        sql`SIMILARITY(${orders.deliveryPONumber}, ${query}) > ${fuzzyThreshold}`,
        sql`SIMILARITY(${orders.pickupAddress}, ${query}) > ${fuzzyThreshold}`,
        sql`SIMILARITY(${orders.deliveryAddress}, ${query}) > ${fuzzyThreshold}`
      )
    )
    .orderBy(desc(orders.createdAt));

    return result.map(row => ({
      ...row.order,
      customer: row.customer!,
      carrier: row.carrier || undefined,
      driver: row.driver || undefined,
    })) as any;
  }

  async getOrdersByStatus(status: string): Promise<(Order & { customer: Customer; carrier?: Carrier; driver?: Driver })[]> {
    const result = await db.select({
      order: orders,
      customer: customers,
      carrier: carriers,
      driver: drivers,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(carriers, eq(orders.carrierId, carriers.id))
    .leftJoin(drivers, eq(orders.driverId, drivers.id))
    .where(eq(orders.orderStatus, status as any));

    return result.map(row => ({
      ...row.order,
      customer: row.customer!,
      carrier: row.carrier || undefined,
      driver: row.driver || undefined,
    })) as any;
  }

  async assignOrderToDriver(orderId: string, driverId: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({ driverId, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return updated || undefined;
  }

  // Order tracking methods
  async addOrderTrackingEvent(event: InsertOrderTrackingEvent): Promise<OrderTrackingEvent> {
    const [newEvent] = await db.insert(orderTrackingEvents).values(event).returning();
    return newEvent;
  }

  async getOrderTrackingEvents(orderId: string): Promise<OrderTrackingEvent[]> {
    return db.select().from(orderTrackingEvents)
      .where(eq(orderTrackingEvents.orderId, orderId))
      .orderBy(desc(orderTrackingEvents.createdAt));
  }

  // Dispatch methods
  async createDispatch(dispatch: InsertDispatch): Promise<Dispatch> {
    // Generate dispatch number
    const timestamp = Date.now();
    const dispatchNumber = `DISP-${timestamp}`;
    
    const [newDispatch] = await db.insert(dispatches)
      .values({ ...dispatch, dispatchNumber })
      .returning();
    return newDispatch;
  }

  async getDispatch(id: string): Promise<Dispatch | undefined> {
    const result = await db.select({
      dispatch: dispatches,
      order: orders,
      customer: customers,
      carrier: carriers,
      driver: drivers,
    })
    .from(dispatches)
    .leftJoin(orders, eq(dispatches.orderId, orders.id))
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(carriers, eq(dispatches.carrierId, carriers.id))
    .leftJoin(drivers, eq(dispatches.driverId, drivers.id))
    .where(eq(dispatches.id, id));

    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      ...row.dispatch,
      order: row.order!,
      customer: row.customer!,
      carrier: row.carrier!,
      driver: row.driver || undefined,
    } as any;
  }

  async getDispatches(limit: number = 100, offset: number = 0): Promise<Dispatch[]> {
    const result = await db.select({
      dispatch: dispatches,
      order: orders,
      customer: customers,
      carrier: carriers,
      driver: drivers,
    })
    .from(dispatches)
    .leftJoin(orders, eq(dispatches.orderId, orders.id))
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(carriers, eq(dispatches.carrierId, carriers.id))
    .leftJoin(drivers, eq(dispatches.driverId, drivers.id))
    .orderBy(desc(dispatches.dispatchedAt))
    .limit(limit)
    .offset(offset);

    return result.map(row => ({
      ...row.dispatch,
      order: row.order!,
      customer: row.customer!,
      carrier: row.carrier!,
      driver: row.driver || undefined,
    })) as any;
  }

  async getDispatchesByOrder(orderId: string): Promise<Dispatch[]> {
    return db.select().from(dispatches)
      .where(eq(dispatches.orderId, orderId))
      .orderBy(desc(dispatches.dispatchedAt));
  }

  async deleteDispatch(id: string): Promise<boolean> {
    const [deleted] = await db.delete(dispatches)
      .where(eq(dispatches.id, id))
      .returning();
    return !!deleted;
  }

  // Dashboard metrics
  async getDashboardMetrics() {
    const [totalOrdersResult] = await db.select({ count: count() }).from(orders);
    const [pendingOrdersResult] = await db.select({ count: count() }).from(orders).where(eq(orders.orderStatus, "pending"));
    const [inTransitResult] = await db.select({ count: count() }).from(orders).where(eq(orders.orderStatus, "shipped"));
    const [revenueResult] = await db.select({ total: sql<string>`COALESCE(SUM(${orders.amount}), 0)` }).from(orders);

    return {
      totalOrders: totalOrdersResult.count,
      pendingOrders: pendingOrdersResult.count,
      totalInTransit: inTransitResult.count,
      totalRevenue: revenueResult.total || "0",
    };
  }
}

export const storage = new DatabaseStorage();
