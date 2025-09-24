import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertCustomerSchema, insertCarrierSchema, 
  insertDriverSchema, insertOrderSchema, insertOrderTrackingEventSchema 
} from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";

// Status transition matrix - defines valid next states for each current state
// Based on stepper requirements: Pending → Processing → Shipped → In Transit → Delivered
const statusTransitions: Record<string, string[]> = {
  "pending": ["processing", "cancelled"],
  "processing": ["shipped", "cancelled"],
  "shipped": ["in_transit", "cancelled"], // Must go through in_transit before delivered
  "in_transit": ["delivered", "cancelled"],
  "delivered": ["delivered"], // Can only stay delivered
  "cancelled": ["cancelled"]  // Can only stay cancelled
};

// Validation schemas for tracking updates
const orderStatusUpdateSchema = z.object({
  orderStatus: z.enum(["pending", "processing", "shipped", "in_transit", "delivered", "cancelled"])
}).strict();

const paymentStatusUpdateSchema = z.object({
  paymentStatus: z.enum(["pending", "paid", "processing", "failed"])
}).strict();

const carrierUpdateSchema = z.object({
  carrierId: z.string().uuid().or(z.literal("")).transform(val => val === "" ? null : val)
}).strict();

const etaUpdateSchema = z.object({
  deliveryDate: z.coerce.date()
}).strict();

const notesUpdateSchema = z.object({
  notes: z.string().min(0).max(10000) // Limit notes to 10KB
}).strict();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required for security");
}

// Type assertion to help TypeScript understand JWT_SECRET is not undefined
const JWT_SAFE_SECRET: string = JWT_SECRET;

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SAFE_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign(
        { userId: user.id, email: user.email, username: user.username },
        JWT_SAFE_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, username: user.username },
        JWT_SAFE_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Dashboard metrics endpoint
  app.get("/api/dashboard/metrics", authenticateToken, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Order management routes
  app.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const { limit = 50, offset = 0, search, status } = req.query;
      
      let orders;
      if (search) {
        orders = await storage.searchOrders(search as string);
      } else if (status) {
        orders = await storage.getOrdersByStatus(status as string);
      } else {
        orders = await storage.getOrders(
          parseInt(limit as string), 
          parseInt(offset as string)
        );
      }
      
      res.json(orders);
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", authenticateToken, async (req, res) => {
    try {
      // Preprocess date strings to Date objects
      const preprocessedData = {
        ...req.body,
        pickupDate: typeof req.body.pickupDate === 'string' ? new Date(req.body.pickupDate) : req.body.pickupDate,
        deliveryDate: typeof req.body.deliveryDate === 'string' ? new Date(req.body.deliveryDate) : req.body.deliveryDate,
      };
      
      console.log('Preprocessed order data:', {
        ...preprocessedData,
        pickupDate: preprocessedData.pickupDate?.toString(),
        deliveryDate: preprocessedData.deliveryDate?.toString()
      });
      
      const orderData = insertOrderSchema.parse(preprocessedData);
      const order = await storage.createOrder(orderData);
      
      // Add initial tracking event
      await storage.addOrderTrackingEvent({
        orderId: order.id,
        status: "pending",
        description: "Order created",
        location: orderData.pickupAddress,
      });
      
      res.status(201).json(order);
    } catch (error) {
      console.error('Create order error:', error);
      res.status(400).json({ error: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      // Preprocess date strings to Date objects
      const preprocessedData = {
        ...req.body,
        ...(req.body.pickupDate && { pickupDate: typeof req.body.pickupDate === 'string' ? new Date(req.body.pickupDate) : req.body.pickupDate }),
        ...(req.body.deliveryDate && { deliveryDate: typeof req.body.deliveryDate === 'string' ? new Date(req.body.deliveryDate) : req.body.deliveryDate }),
      };
      
      const orderData = insertOrderSchema.partial().parse(preprocessedData);
      const updatedOrder = await storage.updateOrder(req.params.id, orderData);
      
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Add tracking event if status changed
      if (orderData.orderStatus) {
        await storage.addOrderTrackingEvent({
          orderId: req.params.id,
          status: orderData.orderStatus,
          description: `Order status updated to ${orderData.orderStatus}`,
          location: orderData.deliveryAddress || updatedOrder.deliveryAddress,
        });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      console.error('Update order error:', error);
      res.status(400).json({ error: "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete order error:', error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Bulk order actions
  app.post("/api/orders/bulk-actions", authenticateToken, async (req, res) => {
    try {
      const { orderIds, action } = req.body;
      
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: "Order IDs array is required" });
      }

      switch (action) {
        case "download_invoice":
          // TODO: Implement invoice download logic
          res.json({ 
            success: true, 
            message: "Invoice download initiated",
            downloadUrl: `/api/orders/invoices/bulk?ids=${orderIds.join(',')}`
          });
          break;
          
        case "print_invoice":
          // TODO: Implement print invoice logic
          res.json({ 
            success: true, 
            message: "Print job initiated for selected orders"
          });
          break;
          
        case "update_status":
          const { status } = req.body;
          if (!status) {
            return res.status(400).json({ error: "Status is required for bulk status update" });
          }
          
          for (const orderId of orderIds) {
            await storage.updateOrder(orderId, { orderStatus: status as any });
            await storage.addOrderTrackingEvent({
              orderId,
              status,
              description: `Bulk status update to ${status}`,
            });
          }
          
          res.json({ success: true, message: `Updated ${orderIds.length} orders to ${status}` });
          break;
          
        default:
          res.status(400).json({ error: "Invalid bulk action" });
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      res.status(500).json({ error: "Bulk action failed" });
    }
  });

  // Order tracking routes
  app.get("/api/orders/:id/tracking", authenticateToken, async (req, res) => {
    try {
      const events = await storage.getOrderTrackingEvents(req.params.id);
      res.json(events);
    } catch (error) {
      console.error('Get tracking events error:', error);
      res.status(500).json({ error: "Failed to fetch tracking events" });
    }
  });

  app.post("/api/orders/:id/tracking", authenticateToken, async (req, res) => {
    try {
      const eventData = insertOrderTrackingEventSchema.parse({
        ...req.body,
        orderId: req.params.id
      });
      const event = await storage.addOrderTrackingEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error('Add tracking event error:', error);
      res.status(400).json({ error: "Failed to add tracking event" });
    }
  });

  // Assign driver to order
  app.post("/api/orders/:id/assign-driver", authenticateToken, async (req, res) => {
    try {
      const { driverId } = req.body;
      
      if (!driverId) {
        return res.status(400).json({ error: "Driver ID is required" });
      }

      const updatedOrder = await storage.assignOrderToDriver(req.params.id, driverId);
      
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Add tracking event
      await storage.addOrderTrackingEvent({
        orderId: req.params.id,
        status: "assigned",
        description: "Driver assigned to order",
      });
      
      // Update driver status
      await storage.updateDriverStatus(driverId, "on_the_way");

      res.json(updatedOrder);
    } catch (error) {
      console.error('Assign driver error:', error);
      res.status(500).json({ error: "Failed to assign driver" });
    }
  });

  // Tracking update routes
  app.patch("/api/orders/:id/status", authenticateToken, async (req, res) => {
    try {
      const { orderStatus } = orderStatusUpdateSchema.parse(req.body);
      
      // Verify order exists before update
      const existingOrder = await storage.getOrder(req.params.id);
      if (!existingOrder) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Business logic: enforce valid status transitions
      const validNextStates = statusTransitions[existingOrder.orderStatus] || [];
      if (!validNextStates.includes(orderStatus)) {
        return res.status(400).json({ 
          error: `Invalid status transition from ${existingOrder.orderStatus} to ${orderStatus}`,
          validTransitions: validNextStates
        });
      }
      
      const updatedOrder = await storage.updateOrder(req.params.id, { orderStatus });
      
      if (!updatedOrder) {
        return res.status(500).json({ error: "Failed to update order" });
      }

      // Add tracking event only after successful update
      await storage.addOrderTrackingEvent({
        orderId: req.params.id,
        status: orderStatus,
        description: `Order status updated to ${orderStatus}`,
      });

      res.json(updatedOrder);
    } catch (error: any) {
      console.error('Update order status error:', error);
      
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.patch("/api/orders/:id/payment", authenticateToken, async (req, res) => {
    try {
      const { paymentStatus } = paymentStatusUpdateSchema.parse(req.body);
      
      // Verify order exists before update
      const existingOrder = await storage.getOrder(req.params.id);
      if (!existingOrder) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const updatedOrder = await storage.updateOrder(req.params.id, { paymentStatus });
      
      if (!updatedOrder) {
        return res.status(500).json({ error: "Failed to update payment status" });
      }

      // Add tracking event only after successful update
      await storage.addOrderTrackingEvent({
        orderId: req.params.id,
        status: "payment_updated",
        description: `Payment status updated to ${paymentStatus}`,
      });

      res.json(updatedOrder);
    } catch (error: any) {
      console.error('Update payment status error:', error);
      
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: "Failed to update payment status" });
    }
  });

  app.patch("/api/orders/:id/carrier", authenticateToken, async (req, res) => {
    try {
      const { carrierId } = carrierUpdateSchema.parse(req.body);
      
      // Verify order exists before update
      const existingOrder = await storage.getOrder(req.params.id);
      if (!existingOrder) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const updatedOrder = await storage.updateOrder(req.params.id, { carrierId });
      
      if (!updatedOrder) {
        return res.status(500).json({ error: "Failed to update carrier assignment" });
      }

      // Add tracking event only after successful update
      const description = carrierId 
        ? "Carrier assigned to order" 
        : "Carrier removed from order";
      
      await storage.addOrderTrackingEvent({
        orderId: req.params.id,
        status: "carrier_updated",
        description,
      });

      res.json(updatedOrder);
    } catch (error: any) {
      console.error('Update carrier assignment error:', error);
      
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: "Failed to update carrier assignment" });
    }
  });

  app.patch("/api/orders/:id/eta", authenticateToken, async (req, res) => {
    try {
      const { deliveryDate } = etaUpdateSchema.parse(req.body);
      
      // Verify order exists before update
      const existingOrder = await storage.getOrder(req.params.id);
      if (!existingOrder) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const updatedOrder = await storage.updateOrder(req.params.id, { deliveryDate });
      
      if (!updatedOrder) {
        return res.status(500).json({ error: "Failed to update delivery date" });
      }

      // Add tracking event only after successful update
      await storage.addOrderTrackingEvent({
        orderId: req.params.id,
        status: "eta_updated",
        description: `Estimated delivery date updated to ${deliveryDate.toISOString().split('T')[0]}`,
      });

      res.json(updatedOrder);
    } catch (error: any) {
      console.error('Update ETA error:', error);
      
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid date format", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: "Failed to update ETA" });
    }
  });

  app.patch("/api/orders/:id/notes", authenticateToken, async (req, res) => {
    try {
      const { notes } = notesUpdateSchema.parse(req.body);
      
      // Verify order exists before update
      const existingOrder = await storage.getOrder(req.params.id);
      if (!existingOrder) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const updatedOrder = await storage.updateOrder(req.params.id, { notes });
      
      if (!updatedOrder) {
        return res.status(500).json({ error: "Failed to update notes" });
      }

      // Add tracking event only after successful update
      await storage.addOrderTrackingEvent({
        orderId: req.params.id,
        status: "notes_updated",
        description: "Shipment notes updated",
      });

      res.json(updatedOrder);
    } catch (error: any) {
      console.error('Update notes error:', error);
      
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ error: "Failed to update shipment notes" });
    }
  });

  // Customer management routes
  app.get("/api/customers", authenticateToken, async (req, res) => {
    try {
      const { limit = 50, offset = 0, search } = req.query;
      
      let customers;
      if (search) {
        customers = await storage.searchCustomers(search as string);
      } else {
        customers = await storage.getCustomers(
          parseInt(limit as string), 
          parseInt(offset as string)
        );
      }
      
      res.json(customers);
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", authenticateToken, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", authenticateToken, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(400).json({ error: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", authenticateToken, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const updatedCustomer = await storage.updateCustomer(req.params.id, customerData);
      
      if (!updatedCustomer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      
      res.json(updatedCustomer);
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(400).json({ error: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteCustomer(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Carrier management routes
  app.get("/api/carriers", authenticateToken, async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const carriers = await storage.getCarriers(
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      res.json(carriers);
    } catch (error) {
      console.error('Get carriers error:', error);
      res.status(500).json({ error: "Failed to fetch carriers" });
    }
  });

  app.get("/api/carriers/:id", authenticateToken, async (req, res) => {
    try {
      const carrier = await storage.getCarrier(req.params.id);
      if (!carrier) {
        return res.status(404).json({ error: "Carrier not found" });
      }
      res.json(carrier);
    } catch (error) {
      console.error('Get carrier error:', error);
      res.status(500).json({ error: "Failed to fetch carrier" });
    }
  });

  app.post("/api/carriers", authenticateToken, async (req, res) => {
    try {
      const carrierData = insertCarrierSchema.parse(req.body);
      const carrier = await storage.createCarrier(carrierData);
      res.status(201).json(carrier);
    } catch (error) {
      console.error('Create carrier error:', error);
      res.status(400).json({ error: "Failed to create carrier" });
    }
  });

  app.put("/api/carriers/:id", authenticateToken, async (req, res) => {
    try {
      const carrierData = insertCarrierSchema.partial().parse(req.body);
      const updatedCarrier = await storage.updateCarrier(req.params.id, carrierData);
      
      if (!updatedCarrier) {
        return res.status(404).json({ error: "Carrier not found" });
      }
      
      res.json(updatedCarrier);
    } catch (error) {
      console.error('Update carrier error:', error);
      res.status(400).json({ error: "Failed to update carrier" });
    }
  });

  app.delete("/api/carriers/:id", authenticateToken, async (req, res) => {
    try {
      const success = await storage.deleteCarrier(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Carrier not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete carrier error:', error);
      res.status(500).json({ error: "Failed to delete carrier" });
    }
  });

  // Driver management routes
  app.get("/api/drivers", authenticateToken, async (req, res) => {
    try {
      const { limit = 50, offset = 0, carrierId } = req.query;
      
      let drivers;
      if (carrierId) {
        drivers = await storage.getDriversByCarrier(carrierId as string);
      } else {
        drivers = await storage.getDrivers(
          parseInt(limit as string), 
          parseInt(offset as string)
        );
      }
      
      res.json(drivers);
    } catch (error) {
      console.error('Get drivers error:', error);
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  app.get("/api/drivers/:id", authenticateToken, async (req, res) => {
    try {
      const driver = await storage.getDriver(req.params.id);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      console.error('Get driver error:', error);
      res.status(500).json({ error: "Failed to fetch driver" });
    }
  });

  app.post("/api/drivers", authenticateToken, async (req, res) => {
    try {
      const driverData = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(driverData);
      res.status(201).json(driver);
    } catch (error) {
      console.error('Create driver error:', error);
      res.status(400).json({ error: "Failed to create driver" });
    }
  });

  app.put("/api/drivers/:id", authenticateToken, async (req, res) => {
    try {
      const driverData = insertDriverSchema.partial().parse(req.body);
      const updatedDriver = await storage.updateDriver(req.params.id, driverData);
      
      if (!updatedDriver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      res.json(updatedDriver);
    } catch (error) {
      console.error('Update driver error:', error);
      res.status(400).json({ error: "Failed to update driver" });
    }
  });

  app.put("/api/drivers/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updatedDriver = await storage.updateDriverStatus(req.params.id, status);
      
      if (!updatedDriver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      res.json(updatedDriver);
    } catch (error) {
      console.error('Update driver status error:', error);
      res.status(400).json({ error: "Failed to update driver status" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
