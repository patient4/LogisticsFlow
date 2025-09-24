import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Edit, Trash2, Search, Filter, Download, Printer, Plus, CalendarIcon, Eye, MapPin, Route, Save, RefreshCw, ExternalLink } from "lucide-react"
import { useLocation } from "wouter"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
}

interface Carrier {
  id: string
  name: string
  code: string
  contactEmail: string
  contactPhone: string
}

interface Driver {
  id: string
  name: string
  phone: string
  licenseNumber: string
}

interface Order {
  id: string
  orderNumber: string
  customerId: string
  carrierId?: string
  driverId?: string
  pickupAddress: string
  pickupDate: string
  pickupTime?: string
  deliveryAddress: string
  deliveryDate: string
  deliveryTime?: string
  numberOfPallets: number
  weight?: string
  dimensions?: string
  amount: string
  gstPercentage?: string
  orderStatus: "pending" | "processing" | "shipped" | "in_transit" | "delivered" | "cancelled"
  paymentStatus: "pending" | "paid" | "processing" | "failed"
  notes?: string
  createdAt: string
  updatedAt: string
  customer: Customer
  carrier?: Carrier
  driver?: Driver
}

// Location schema for array items
const locationSchema = z.object({
  address: z.string().min(1, "Address is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
})

// Form validation schema
const createOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  carrierId: z.string().optional().or(z.literal("")),
  // Keep single fields for backward compatibility and default behavior
  pickupAddress: z.string().min(1, "Pickup address is required"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  pickupTime: z.string().optional().or(z.literal("")),
  pickupPONumber: z.string().optional().or(z.literal("")),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  deliveryTime: z.string().optional().or(z.literal("")),
  deliveryPONumber: z.string().optional().or(z.literal("")),
  // Add arrays for multiple locations
  pickupLocations: z.array(locationSchema).optional().default([]),
  deliveryLocations: z.array(locationSchema).optional().default([]),
  numberOfPallets: z.preprocess(
    (val) => val === "" ? 1 : Number(val),
    z.number().min(0, "Number of pallets must be 0 or greater")
  ),
  weight: z.string().optional().or(z.literal("")),
  dimensions: z.string().optional().or(z.literal("")),
  amount: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, "Amount must be greater than 0")
  ),
  gstPercentage: z.preprocess(
    (val) => val === "" ? 0 : Number(val),
    z.number().min(0).max(100)
  ),
  notes: z.string().optional().or(z.literal("")),
})

export function OrdersTable() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [location, setLocation] = useLocation()

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch customers')
      return response.json()
    },
  })

  // Fetch carriers for dropdown
  const { data: carriers = [] } = useQuery<Carrier[]>({
    queryKey: ['/api/carriers'],
    queryFn: async () => {
      const response = await fetch('/api/carriers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch carriers')
      return response.json()
    },
  })

  // Fetch orders with search and filter
  const { data: orders = [], isLoading, error } = useQuery<Order[]>({
    queryKey: ['/api/orders', { search: searchQuery, status: statusFilter === 'all' ? undefined : statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      
      const response = await fetch(`/api/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch orders')
      return response.json()
    },
  })

  // Order status update mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: Order['orderStatus'] }) => {
      const response = await apiRequest('PATCH', `/api/orders/${orderId}/status`, { orderStatus: status })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] })
      toast({ title: "Success", description: "Order status updated successfully" })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" })
    },
  })

  // Payment status update mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: Order['paymentStatus'] }) => {
      const response = await apiRequest('PATCH', `/api/orders/${orderId}/payment`, { paymentStatus: status })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] })
      toast({ title: "Success", description: "Payment status updated successfully" })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update payment status", variant: "destructive" })
    },
  })

  // Carrier assignment update mutation
  const updateCarrierMutation = useMutation({
    mutationFn: async ({ orderId, carrierId }: { orderId: string, carrierId?: string }) => {
      const response = await apiRequest('PATCH', `/api/orders/${orderId}/carrier`, { carrierId })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] })
      toast({ title: "Success", description: "Carrier assignment updated successfully" })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update carrier assignment", variant: "destructive" })
    },
  })

  // ETA update mutation
  const updateETAMutation = useMutation({
    mutationFn: async ({ orderId, deliveryDate }: { orderId: string, deliveryDate: string }) => {
      const response = await apiRequest('PATCH', `/api/orders/${orderId}/eta`, { deliveryDate })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] })
      toast({ title: "Success", description: "Estimated delivery date updated successfully" })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update ETA", variant: "destructive" })
    },
  })

  // Shipment notes update mutation
  const updateNotesMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: string, notes: string }) => {
      const response = await apiRequest('PATCH', `/api/orders/${orderId}/notes`, { notes })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] })
      toast({ title: "Success", description: "Shipment notes saved successfully" })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save shipment notes", variant: "destructive" })
    },
  })

  // Helper functions for tracking updates
  const updateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    updateOrderStatusMutation.mutate({ orderId, status })
  }

  const updatePaymentStatus = (orderId: string, status: Order['paymentStatus']) => {
    updatePaymentStatusMutation.mutate({ orderId, status })
  }

  const updateCarrierAssignment = (orderId: string, carrierId?: string) => {
    updateCarrierMutation.mutate({ orderId, carrierId })
  }

  const updateETA = (orderId: string, deliveryDate: string) => {
    updateETAMutation.mutate({ orderId, deliveryDate })
  }

  const saveShipmentNotes = (orderId: string, notes: string) => {
    updateNotesMutation.mutate({ orderId, notes })
  }

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: z.infer<typeof createOrderSchema>) => {
      console.log('Creating order with data:', orderData)
      console.log('Auth token:', localStorage.getItem('auth_token') ? 'Present' : 'Missing')
      
      // Transform data to match backend expectations
      const transformedData = {
        ...orderData,
        // Convert date strings to Date objects
        pickupDate: new Date(orderData.pickupDate),
        deliveryDate: new Date(orderData.deliveryDate),
        // Convert numbers to strings for decimal fields  
        amount: orderData.amount.toString(),
        gstPercentage: orderData.gstPercentage.toString(),
        numberOfPallets: parseInt(orderData.numberOfPallets.toString()),
        // Transform location arrays for database storage
        pickupLocations: orderData.pickupLocations.length > 0 
          ? orderData.pickupLocations.map(location => JSON.stringify({
              address: location.address,
              date: location.date,
              time: location.time || null,
              notes: location.notes || null,
            }))
          : null,
        deliveryLocations: orderData.deliveryLocations.length > 0 
          ? orderData.deliveryLocations.map(location => JSON.stringify({
              address: location.address,
              date: location.date,
              time: location.time || null,
              notes: location.notes || null,
            }))
          : null,
      }
      
      console.log('Transformed data for API:', transformedData)
      
      const response = await apiRequest('POST', '/api/orders', transformedData)
      const result = await response.json()
      console.log('Order creation response:', result)
      return result
    },
    onSuccess: (data) => {
      console.log('Order created successfully:', data)
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] })
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] })
      setIsCreateModalOpen(false)
      toast({
        title: "Success",
        description: "Order created successfully",
      })
    },
    onError: (error) => {
      console.error('Create order error:', error)
      toast({
        title: "Error",
        description: `Failed to create order: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  // Edit order mutation
  const editOrderMutation = useMutation({
    mutationFn: async ({ orderId, orderData }: { orderId: string; orderData: z.infer<typeof createOrderSchema> }) => {
      console.log('Updating order with data:', orderData)
      console.log('Order ID:', orderId)
      
      // Transform data similar to create mutation
      const transformedData = {
        ...orderData,
        // Convert date strings to Date objects
        pickupDate: new Date(orderData.pickupDate),
        deliveryDate: new Date(orderData.deliveryDate),
        // Convert numbers to strings for decimal fields  
        amount: orderData.amount.toString(),
        gstPercentage: orderData.gstPercentage.toString(),
        numberOfPallets: parseInt(orderData.numberOfPallets.toString()),
        // Transform location arrays for database storage
        pickupLocations: orderData.pickupLocations.length > 0 
          ? orderData.pickupLocations.map(location => JSON.stringify({
              address: location.address,
              date: location.date,
              time: location.time || null,
              notes: location.notes || null,
            }))
          : null,
        deliveryLocations: orderData.deliveryLocations.length > 0 
          ? orderData.deliveryLocations.map(location => JSON.stringify({
              address: location.address,
              date: location.date,
              time: location.time || null,
              notes: location.notes || null,
            }))
          : null,
      }
      
      console.log('Transformed data for API:', transformedData)
      
      const response = await apiRequest('PUT', `/api/orders/${orderId}`, transformedData)
      const result = await response.json()
      console.log('Order update response:', result)
      return result
    },
    onSuccess: (data) => {
      console.log('Order updated successfully:', data)
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] })
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] })
      setEditingOrder(null)
      toast({
        title: "Success",
        description: "Order updated successfully",
      })
    },
    onError: (error) => {
      console.error('Edit order error:', error)
      toast({
        title: "Error",
        description: `Failed to update order: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('DELETE', `/api/orders/${orderId}`)
      return orderId // Return the deleted order ID for use in onSuccess
    },
    onSuccess: (deletedOrderId) => {
      // Remove deleted order from selected orders
      setSelectedOrders(prev => prev.filter(id => id !== deletedOrderId))
      
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] })
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] })
      toast({
        title: "Success",
        description: "Order deleted successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete order: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  // Filtered orders based on search and status
  const filteredOrders = useMemo(() => {
    if (!orders) return []
    return orders.filter(order => {
      const matchesSearch = searchQuery === "" || 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || order.orderStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, statusFilter])

  // Handle checkbox selection
  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId])
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(order => order.id))
    } else {
      setSelectedOrders([])
    }
  }


  // Show Invoice Preview functionality
  const handlePreviewInvoice = () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No orders selected",
        description: "Please select orders to generate invoice",
        variant: "destructive",
      })
      return
    }

    // Get selected order data
    const selectedOrderData = orders?.filter(order => selectedOrders.includes(order.id)) || []
    
    if (selectedOrderData.length === 0) {
      toast({
        title: "Error",
        description: "Unable to find selected order data",
        variant: "destructive",
      })
      return
    }

    setIsInvoicePreviewOpen(true)
  }

  // Handle tracking navigation - navigate to tracking page with order ID
  const handleOpenTracking = (order: Order) => {
    setLocation(`/tracking/${order.id}`)
  }

  // Download Invoice functionality (now called from preview modal)
  const handleDownloadInvoice = async () => {
    // Get selected order data
    const selectedOrderData = orders?.filter(order => selectedOrders.includes(order.id)) || []
    
    if (selectedOrderData.length === 0) {
      toast({
        title: "Error",
        description: "Unable to find selected order data",
        variant: "destructive",
      })
      return
    }

    try {
      // Create invoice HTML content
      const invoiceHTML = generateInvoiceHTML(selectedOrderData)
      
      // Create a temporary div to render the invoice
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = invoiceHTML
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      document.body.appendChild(tempDiv)

      // Capture the HTML as canvas using html2canvas
      const canvas = await html2canvas(tempDiv, {
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        scale: 2, // Higher quality
      })

      // Remove the temporary div
      document.body.removeChild(tempDiv)

      // Create PDF using jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add new pages if content exceeds one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Generate filename
      const timestamp = format(new Date(), 'yyyy-MM-dd')
      const filename = selectedOrderData.length === 1 
        ? `invoice-${selectedOrderData[0].orderNumber}-${timestamp}.pdf`
        : `invoices-${selectedOrderData.length}-orders-${timestamp}.pdf`

      // Download the PDF
      pdf.save(filename)

      // Close the preview modal
      setIsInvoicePreviewOpen(false)

      toast({
        title: "Success",
        description: `Invoice${selectedOrderData.length > 1 ? 's' : ''} downloaded successfully`,
      })
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Generate invoice HTML template
  const generateInvoiceHTML = (orders: Order[]) => {
    const total = orders.reduce((sum, order) => sum + parseFloat(order.amount), 0)
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 794px; margin: 0 auto; padding: 40px; background: white;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #8B5CF6; padding-bottom: 20px;">
          <h1 style="color: #8B5CF6; font-size: 28px; margin: 0;">LOGISTICS INVOICE</h1>
          <p style="color: #666; margin: 10px 0;">Professional Logistics Services</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h3 style="color: #333; border-bottom: 2px solid #8B5CF6; padding-bottom: 5px;">From:</h3>
            <p style="margin: 10px 0; line-height: 1.5;">
              <strong>Logistics Company</strong><br>
              123 Business Street<br>
              Business City, BC V1A 1A1<br>
              Phone: (555) 123-4567<br>
              Email: billing@logistics.com
            </p>
          </div>
          <div style="text-align: right;">
            <h3 style="color: #333; border-bottom: 2px solid #8B5CF6; padding-bottom: 5px;">Invoice Details:</h3>
            <p style="margin: 10px 0; line-height: 1.5;">
              <strong>Date:</strong> ${format(new Date(), 'PPP')}<br>
              <strong>Invoice #:</strong> INV-${Date.now()}<br>
              <strong>Orders:</strong> ${orders.length}<br>
              <strong>Total Amount:</strong> <span style="color: #8B5CF6; font-size: 18px;">$${total.toFixed(2)}</span>
            </p>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; border-bottom: 2px solid #8B5CF6; padding-bottom: 5px; margin-bottom: 15px;">Order Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background-color: #8B5CF6; color: white;">
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Order #</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Customer</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Pickup</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Delivery</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map((order, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${order.orderNumber}</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">
                    <strong>${order.customer.name}</strong><br>
                    <small style="color: #666;">${order.customer.email}</small>
                  </td>
                  <td style="padding: 12px; border: 1px solid #ddd; font-size: 14px;">
                    ${order.pickupAddress}<br>
                    <small style="color: #666;">Date: ${format(new Date(order.pickupDate), 'PP')}</small>
                  </td>
                  <td style="padding: 12px; border: 1px solid #ddd; font-size: 14px;">
                    ${order.deliveryAddress}<br>
                    <small style="color: #666;">Date: ${format(new Date(order.deliveryDate), 'PP')}</small>
                  </td>
                  <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #8B5CF6;">
                    $${parseFloat(order.amount).toFixed(2)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="border-top: 2px solid #8B5CF6; padding-top: 20px;">
          <div style="text-align: right; margin-bottom: 20px;">
            <table style="margin-left: auto;">
              <tr>
                <td style="padding: 5px 15px; text-align: right; font-weight: bold;">Subtotal:</td>
                <td style="padding: 5px 15px; text-align: right;">$${total.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 15px; text-align: right; font-weight: bold;">Tax (GST):</td>
                <td style="padding: 5px 15px; text-align: right;">$${(total * 0.05).toFixed(2)}</td>
              </tr>
              <tr style="border-top: 2px solid #8B5CF6;">
                <td style="padding: 10px 15px; text-align: right; font-weight: bold; font-size: 18px; color: #8B5CF6;">Total:</td>
                <td style="padding: 10px 15px; text-align: right; font-weight: bold; font-size: 18px; color: #8B5CF6;">$${(total * 1.05).toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p>Thank you for choosing our logistics services!</p>
            <p>Payment terms: Net 30 days | Questions? Contact us at billing@logistics.com</p>
          </div>
        </div>
      </div>
    `
  }

  // Status badge colors
  const getStatusBadge = (status: string, type: 'order' | 'payment') => {
    const variants = {
      order: {
        pending: "secondary",
        processing: "default", 
        shipped: "outline",
        delivered: "default",
        cancelled: "destructive"
      },
      payment: {
        pending: "secondary",
        paid: "default",
        processing: "outline", 
        failed: "destructive"
      }
    } as const

    return (
      <Badge 
        variant={variants[type][status as keyof typeof variants[typeof type]] || "secondary"} 
        className="capitalize"
        data-testid={`badge-${type}-${status}`}
      >
        {status}
      </Badge>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-destructive">Failed to load orders. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          {/* Search */}
          <div className="relative min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search orders or customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {selectedOrders.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handlePreviewInvoice}
              data-testid="button-preview-invoice"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Invoice
            </Button>
          )}
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-order">
                <Plus className="w-4 h-4 mr-2" />
                Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
              </DialogHeader>
              <CreateOrderForm
                customers={customers}
                carriers={carriers}
                onSubmit={(data) => createOrderMutation.mutate(data)}
                isLoading={createOrderMutation.isPending}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Order Modal */}
          <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Order {editingOrder?.orderNumber}</DialogTitle>
              </DialogHeader>
              {editingOrder && (
                <EditOrderForm
                  customers={customers}
                  carriers={carriers}
                  order={editingOrder}
                  onSubmit={(data) => editOrderMutation.mutate({ orderId: editingOrder.id, orderData: data })}
                  onCancel={() => setEditingOrder(null)}
                  isLoading={editOrderMutation.isPending}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order, index) => (
                  <TableRow 
                    key={order.id} 
                    className={index % 2 === 0 ? "bg-muted/30" : "bg-background"}
                    data-testid={`row-order-${order.id}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                        data-testid={`checkbox-order-${order.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-order-number-${order.id}`}>
                      {order.orderNumber}
                    </TableCell>
                    <TableCell data-testid={`text-customer-${order.id}`}>
                      {order.customer.name}
                    </TableCell>
                    <TableCell data-testid={`text-pickup-${order.id}`}>
                      {order.pickupAddress}
                    </TableCell>
                    <TableCell data-testid={`text-delivery-${order.id}`}>
                      {order.deliveryAddress}
                    </TableCell>
                    <TableCell data-testid={`text-amount-${order.id}`}>
                      ${parseFloat(order.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.orderStatus, 'order')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.paymentStatus, 'payment')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenTracking(order)}
                        data-testid={`button-tracking-${order.id}`}
                      >
                        <Route className="w-4 h-4 mr-2" />
                        View Route & Update
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingOrder(order)}
                          data-testid={`button-edit-${order.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-delete-${order.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Order</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete order {order.orderNumber}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteOrderMutation.mutate(order.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Selected orders info */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
          </span>
        </div>
      )}
      
      {/* Invoice Preview Modal */}
      <Dialog open={isInvoicePreviewOpen} onOpenChange={setIsInvoicePreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-[calc(90vh-120px)]">
            {/* Invoice Preview Content */}
            <div 
              className="flex-1 overflow-auto border rounded-lg p-1"
              style={{ backgroundColor: '#f8f9fa' }}
            >
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: orders && selectedOrders.length > 0 
                    ? generateInvoiceHTML(orders.filter(order => selectedOrders.includes(order.id)))
                    : ""
                }}
                style={{ 
                  transform: 'scale(0.75)', 
                  transformOrigin: 'top left',
                  width: '133%',
                  height: '133%'
                }}
              />
            </div>
            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsInvoicePreviewOpen(false)}
                data-testid="button-close-preview"
              >
                Close
              </Button>
              <Button
                onClick={handleDownloadInvoice}
                data-testid="button-download-from-preview"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  )
}

// CreateOrderForm component
interface CreateOrderFormProps {
  customers: Customer[]
  carriers: Carrier[]
  onSubmit: (data: z.infer<typeof createOrderSchema>) => void
  isLoading: boolean
}

function CreateOrderForm({ customers, carriers, onSubmit, isLoading }: CreateOrderFormProps) {
  const form = useForm<z.infer<typeof createOrderSchema>>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerId: "",
      carrierId: "",
      pickupAddress: "",
      pickupDate: "",
      pickupTime: "",
      pickupPONumber: "",
      deliveryAddress: "",
      deliveryDate: "",
      deliveryTime: "",
      deliveryPONumber: "",
      pickupLocations: [],
      deliveryLocations: [],
      numberOfPallets: 1,
      weight: "",
      dimensions: "",
      amount: 0,
      gstPercentage: 0,
      notes: "",
    },
  })

  // Field arrays for multiple pickup and delivery locations
  const {
    fields: pickupFields,
    append: appendPickup,
    remove: removePickup,
  } = useFieldArray({
    control: form.control,
    name: "pickupLocations",
  })

  const {
    fields: deliveryFields,
    append: appendDelivery,
    remove: removeDelivery,
  } = useFieldArray({
    control: form.control,
    name: "deliveryLocations",
  })

  const handleSubmit = (data: z.infer<typeof createOrderSchema>) => {
    console.log('Form submitted with data:', data)
    console.log('Form validation errors:', form.formState.errors)
    
    // Convert empty strings to undefined for optional fields
    const cleanedData = {
      ...data,
      carrierId: data.carrierId === "" ? undefined : data.carrierId,
      pickupTime: data.pickupTime === "" ? undefined : data.pickupTime,
      pickupPONumber: data.pickupPONumber === "" ? undefined : data.pickupPONumber,
      deliveryTime: data.deliveryTime === "" ? undefined : data.deliveryTime,
      deliveryPONumber: data.deliveryPONumber === "" ? undefined : data.deliveryPONumber,
      weight: data.weight === "" ? undefined : data.weight,
      dimensions: data.dimensions === "" ? undefined : data.dimensions,
      notes: data.notes === "" ? undefined : data.notes,
    }
    
    console.log('Cleaned data for API:', cleanedData)
    onSubmit(cleanedData)
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          console.log('Form submit event triggered')
          console.log('Form state:', form.formState)
          console.log('Form values:', form.getValues())
          form.handleSubmit(handleSubmit)(e)
        }} 
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Selection */}
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-customer">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Carrier Selection */}
          <FormField
            control={form.control}
            name="carrierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carrier</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-carrier">
                      <SelectValue placeholder="Select carrier (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {carriers.map((carrier) => (
                      <SelectItem key={carrier.id} value={carrier.id}>
                        {carrier.name} - {carrier.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pickup Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Pickup Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="pickupAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter pickup address" {...field} data-testid="input-pickup-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="pickupDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Date *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      data-testid="input-pickup-date"
                      onChange={(e) => {
                        console.log('Pickup date changed:', e.target.value)
                        field.onChange(e.target.value)
                        // Manually trigger form validation
                        form.trigger('pickupDate')
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="pickupTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} data-testid="input-pickup-time" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pickupPONumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup PO Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter pickup PO number (optional)" {...field} data-testid="input-pickup-po-number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Delivery Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Delivery Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="deliveryAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter delivery address" {...field} data-testid="input-delivery-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Date *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      data-testid="input-delivery-date"
                      onChange={(e) => {
                        console.log('Delivery date changed:', e.target.value)
                        field.onChange(e.target.value)
                        // Manually trigger form validation
                        form.trigger('deliveryDate')
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="deliveryTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} data-testid="input-delivery-time" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deliveryPONumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery PO Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter delivery PO number (optional)" {...field} data-testid="input-delivery-po-number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Additional Pickup Locations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Additional Pickup Locations</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendPickup({ address: "", date: "", time: "", notes: "" })}
              data-testid="button-add-pickup"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Pickup
            </Button>
          </div>

          {pickupFields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-sm font-medium">Pickup Location {index + 1}</h5>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removePickup(index)}
                  data-testid={`button-remove-pickup-${index}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name={`pickupLocations.${index}.address`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter pickup address" {...field} data-testid={`input-pickup-address-${index}`} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`pickupLocations.${index}.date`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid={`input-pickup-date-${index}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name={`pickupLocations.${index}.time`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid={`input-pickup-time-${index}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`pickupLocations.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional notes" {...field} data-testid={`input-pickup-notes-${index}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Delivery Locations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Additional Delivery Locations</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendDelivery({ address: "", date: "", time: "", notes: "" })}
              data-testid="button-add-delivery"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Delivery
            </Button>
          </div>

          {deliveryFields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-sm font-medium">Delivery Location {index + 1}</h5>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeDelivery(index)}
                  data-testid={`button-remove-delivery-${index}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name={`deliveryLocations.${index}.address`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter delivery address" {...field} data-testid={`input-delivery-address-${index}`} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`deliveryLocations.${index}.date`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid={`input-delivery-date-${index}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name={`deliveryLocations.${index}.time`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid={`input-delivery-time-${index}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`deliveryLocations.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional notes" {...field} data-testid={`input-delivery-notes-${index}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Package Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Package Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="numberOfPallets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Pallets</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} data-testid="input-pallets" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 100.5" {...field} data-testid="input-weight" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dimensions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dimensions</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 100x50x30 cm" {...field} data-testid="input-dimensions" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Financial Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0.01" 
                      placeholder="0.00" 
                      {...field}
                      data-testid="input-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gstPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Percentage</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      max="100" 
                      placeholder="0.00" 
                      {...field}
                      data-testid="input-gst"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional notes or instructions..."
                  className="resize-none"
                  rows={3}
                  {...field}
                  data-testid="textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isLoading}
            data-testid="button-reset"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            data-testid="button-submit-order"
            onClick={() => console.log('Submit button clicked')}
          >
            {isLoading ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

// EditOrderForm component
interface EditOrderFormProps {
  customers: Customer[]
  carriers: Carrier[]
  order: Order
  onSubmit: (data: z.infer<typeof createOrderSchema>) => void
  onCancel: () => void
  isLoading: boolean
}

function EditOrderForm({ customers, carriers, order, onSubmit, onCancel, isLoading }: EditOrderFormProps) {
  const form = useForm<z.infer<typeof createOrderSchema>>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerId: order.customerId,
      carrierId: order.carrierId || "",
      pickupAddress: order.pickupAddress,
      pickupDate: order.pickupDate.split('T')[0], // Convert ISO date to YYYY-MM-DD
      pickupTime: order.pickupTime || "",
      pickupPONumber: (order as any).pickupPONumber || "",
      deliveryAddress: order.deliveryAddress,
      deliveryDate: order.deliveryDate.split('T')[0], // Convert ISO date to YYYY-MM-DD  
      deliveryTime: order.deliveryTime || "",
      deliveryPONumber: (order as any).deliveryPONumber || "",
      pickupLocations: [], // TODO: Parse JSON from database if exists
      deliveryLocations: [], // TODO: Parse JSON from database if exists
      numberOfPallets: order.numberOfPallets,
      weight: order.weight || "",
      dimensions: order.dimensions || "",
      amount: parseFloat(order.amount),
      gstPercentage: parseFloat(order.gstPercentage || "0"),
      notes: order.notes || "",
    },
  })

  // Field arrays for multiple pickup and delivery locations
  const {
    fields: pickupFields,
    append: appendPickup,
    remove: removePickup,
  } = useFieldArray({
    control: form.control,
    name: "pickupLocations",
  })

  const {
    fields: deliveryFields,
    append: appendDelivery,
    remove: removeDelivery,
  } = useFieldArray({
    control: form.control,
    name: "deliveryLocations",
  })

  const handleSubmit = (data: z.infer<typeof createOrderSchema>) => {
    console.log('Form submitted with data:', data)
    console.log('Form validation errors:', form.formState.errors)
    
    // Convert empty strings to undefined for optional fields
    const cleanedData = {
      ...data,
      carrierId: data.carrierId === "" ? undefined : data.carrierId,
      pickupTime: data.pickupTime === "" ? undefined : data.pickupTime,
      pickupPONumber: data.pickupPONumber === "" ? undefined : data.pickupPONumber,
      deliveryTime: data.deliveryTime === "" ? undefined : data.deliveryTime,
      deliveryPONumber: data.deliveryPONumber === "" ? undefined : data.deliveryPONumber,
      weight: data.weight === "" ? undefined : data.weight,
      dimensions: data.dimensions === "" ? undefined : data.dimensions,
      notes: data.notes === "" ? undefined : data.notes,
    }
    
    console.log('Cleaned data for API:', cleanedData)
    onSubmit(cleanedData)
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          console.log('Edit form submit event triggered')
          console.log('Form state:', form.formState)
          console.log('Form values:', form.getValues())
          form.handleSubmit(handleSubmit)(e)
        }} 
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Selection */}
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="edit-select-customer">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Carrier Selection */}
          <FormField
            control={form.control}
            name="carrierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carrier</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="edit-select-carrier">
                      <SelectValue placeholder="Select carrier (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {carriers.map((carrier) => (
                      <SelectItem key={carrier.id} value={carrier.id}>
                        {carrier.name} - {carrier.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pickup Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Pickup Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="pickupAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter pickup address" {...field} data-testid="edit-input-pickup-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="pickupDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Date *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      data-testid="edit-input-pickup-date"
                      onChange={(e) => {
                        console.log('Pickup date changed:', e.target.value)
                        field.onChange(e.target.value)
                        form.trigger('pickupDate')
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="pickupTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} data-testid="edit-input-pickup-time" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pickupPONumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup PO Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter pickup PO number (optional)" {...field} data-testid="edit-input-pickup-po-number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Delivery Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Delivery Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="deliveryAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter delivery address" {...field} data-testid="edit-input-delivery-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Date *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      data-testid="edit-input-delivery-date"
                      onChange={(e) => {
                        console.log('Delivery date changed:', e.target.value)
                        field.onChange(e.target.value)
                        form.trigger('deliveryDate')
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="deliveryTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} data-testid="edit-input-delivery-time" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deliveryPONumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery PO Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter delivery PO number (optional)" {...field} data-testid="edit-input-delivery-po-number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Additional Pickup Locations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Additional Pickup Locations</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendPickup({ address: "", date: "", time: "", notes: "" })}
              data-testid="edit-button-add-pickup"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Pickup
            </Button>
          </div>

          {pickupFields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-sm font-medium">Pickup Location {index + 1}</h5>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removePickup(index)}
                  data-testid={`edit-button-remove-pickup-${index}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name={`pickupLocations.${index}.address`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter pickup address" {...field} data-testid={`edit-input-pickup-address-${index}`} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`pickupLocations.${index}.date`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid={`edit-input-pickup-date-${index}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name={`pickupLocations.${index}.time`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid={`edit-input-pickup-time-${index}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`pickupLocations.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional notes" {...field} data-testid={`edit-input-pickup-notes-${index}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Delivery Locations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Additional Delivery Locations</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendDelivery({ address: "", date: "", time: "", notes: "" })}
              data-testid="edit-button-add-delivery"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Delivery
            </Button>
          </div>

          {deliveryFields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-sm font-medium">Delivery Location {index + 1}</h5>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeDelivery(index)}
                  data-testid={`edit-button-remove-delivery-${index}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name={`deliveryLocations.${index}.address`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter delivery address" {...field} data-testid={`edit-input-delivery-address-${index}`} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`deliveryLocations.${index}.date`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid={`edit-input-delivery-date-${index}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name={`deliveryLocations.${index}.time`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid={`edit-input-delivery-time-${index}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`deliveryLocations.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional notes" {...field} data-testid={`edit-input-delivery-notes-${index}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Package Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Package Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="numberOfPallets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Pallets</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} data-testid="edit-input-pallets" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} data-testid="edit-input-weight" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dimensions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dimensions (LxWxH)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 120x80x150 cm" {...field} data-testid="edit-input-dimensions" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Financial Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($) *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                      data-testid="edit-input-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gstPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Percentage (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      max="100"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                      data-testid="edit-input-gst"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional notes or instructions..."
                  className="resize-none"
                  rows={3}
                  {...field}
                  data-testid="edit-textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            data-testid="edit-button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            data-testid="edit-button-submit-order"
          >
            {isLoading ? "Updating..." : "Update Order"}
          </Button>
        </div>
      </form>
    </Form>
  )
}