import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Trash2, Search, Filter, Download, Printer, Plus, CalendarIcon } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
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
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  paymentStatus: "pending" | "paid" | "processing" | "failed"
  notes?: string
  createdAt: string
  updatedAt: string
  customer: Customer
  carrier?: Carrier
  driver?: Driver
}

// Form validation schema
const createOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  carrierId: z.string().optional().or(z.literal("")),
  pickupAddress: z.string().min(1, "Pickup address is required"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  pickupTime: z.string().optional().or(z.literal("")),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  deliveryTime: z.string().optional().or(z.literal("")),
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
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

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

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('DELETE', `/api/orders/${orderId}`)
      return response
    },
    onSuccess: () => {
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

  // Export to CSV
  const handleExport = () => {
    if (filteredOrders.length === 0) {
      toast({
        title: "No data",
        description: "No orders to export",
        variant: "destructive",
      })
      return
    }

    const csvData = filteredOrders.map(order => ({
      'Order Number': order.orderNumber,
      'Customer': order.customer.name,
      'Pickup Address': order.pickupAddress,
      'Delivery Address': order.deliveryAddress,
      'Amount': `$${parseFloat(order.amount).toFixed(2)}`,
      'Status': order.orderStatus,
      'Payment Status': order.paymentStatus,
      'Created': format(new Date(order.createdAt), 'yyyy-MM-dd'),
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Orders exported to CSV successfully",
    })
  }

  // Print functionality
  const handlePrint = () => {
    if (filteredOrders.length === 0) {
      toast({
        title: "No data",
        description: "No orders to print",
        variant: "destructive",
      })
      return
    }

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const printContent = `
        <html>
          <head>
            <title>Orders Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .header { margin-bottom: 20px; }
              .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
              .badge.pending { background-color: #fef3c7; color: #92400e; }
              .badge.processing { background-color: #dbeafe; color: #1e40af; }
              .badge.shipped { background-color: #d1fae5; color: #065f46; }
              .badge.delivered { background-color: #dcfce7; color: #166534; }
              .badge.paid { background-color: #dcfce7; color: #166534; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Orders Report</h1>
              <p>Generated on: ${format(new Date(), 'PPP')}</p>
              <p>Total Orders: ${filteredOrders.length}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Pickup</th>
                  <th>Delivery</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                ${filteredOrders.map(order => `
                  <tr>
                    <td>${order.orderNumber}</td>
                    <td>${order.customer.name}</td>
                    <td>${order.pickupAddress}</td>
                    <td>${order.deliveryAddress}</td>
                    <td>$${parseFloat(order.amount).toFixed(2)}</td>
                    <td><span class="badge ${order.orderStatus}">${order.orderStatus}</span></td>
                    <td><span class="badge ${order.paymentStatus}">${order.paymentStatus}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
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
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint} data-testid="button-print">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
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
          <div className="flex gap-2">
            <Button size="sm" variant="outline" data-testid="button-bulk-export">
              <Download className="w-4 h-4 mr-2" />
              Export Selected
            </Button>
            <Button size="sm" variant="outline" data-testid="button-bulk-print">
              <Printer className="w-4 h-4 mr-2" />
              Print Selected
            </Button>
          </div>
        </div>
      )}
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
      deliveryAddress: "",
      deliveryDate: "",
      deliveryTime: "",
      numberOfPallets: 1,
      weight: "",
      dimensions: "",
      amount: 0,
      gstPercentage: 0,
      notes: "",
    },
  })

  const handleSubmit = (data: z.infer<typeof createOrderSchema>) => {
    console.log('Form submitted with data:', data)
    console.log('Form validation errors:', form.formState.errors)
    
    // Convert empty strings to undefined for optional fields
    const cleanedData = {
      ...data,
      carrierId: data.carrierId === "" ? undefined : data.carrierId,
      pickupTime: data.pickupTime === "" ? undefined : data.pickupTime,
      deliveryTime: data.deliveryTime === "" ? undefined : data.deliveryTime,
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