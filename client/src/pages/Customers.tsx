import { useState, useMemo } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Users,
  DollarSign,
  Phone,
  Mail
} from "lucide-react"
import type { Customer, Order, InsertCustomer } from "@/../../shared/schema"
import { insertCustomerSchema } from "@/../../shared/schema"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"

// Extended customer type with statistics
interface CustomerWithStats extends Customer {
  totalOrders: number
  totalSpend: number
  status: "active" | "inactive"
}

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const { toast } = useToast()

  // Form for adding new customer
  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: ""
    }
  })

  // Fetch customers with search functionality
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers', searchTerm],
    queryFn: async () => {
      const url = searchTerm 
        ? `/api/customers?search=${encodeURIComponent(searchTerm)}`
        : '/api/customers'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch customers')
      return response.json() as Customer[]
    }
  })

  // Fetch all orders to calculate customer statistics
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders?limit=1000') // Get enough orders for calculation
      if (!response.ok) throw new Error('Failed to fetch orders')
      return response.json() as (Order & { customer: Customer })[]
    }
  })

  // Calculate customer statistics from orders
  const customersWithStats: CustomerWithStats[] = useMemo(() => {
    return customers.map(customer => {
      const customerOrders = orders.filter(order => order.customerId === customer.id)
      
      const totalOrders = customerOrders.length
      const totalSpend = customerOrders.reduce((sum, order) => {
        const amount = parseFloat(order.amount?.toString() || '0')
        return sum + amount
      }, 0)
      
      // Consider customer active if they have orders in the last 90 days
      const recentThreshold = new Date()
      recentThreshold.setDate(recentThreshold.getDate() - 90)
      
      const hasRecentOrders = customerOrders.some(order => 
        new Date(order.createdAt || '') > recentThreshold
      )
      
      const status = hasRecentOrders ? "active" : "inactive"

      return {
        ...customer,
        totalOrders,
        totalSpend,
        status
      }
    })
  }, [customers, orders])

  const isLoading = isLoadingCustomers || isLoadingOrders

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: InsertCustomer) => {
      return apiRequest('POST', '/api/customers', customerData)
    },
    onSuccess: () => {
      // Invalidate all customer queries, including filtered ones
      queryClient.invalidateQueries({ queryKey: ['/api/customers'], exact: false })
      toast({
        title: "Customer Created",
        description: "New customer has been successfully added.",
      })
      form.reset()
      setIsAddModalOpen(false)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      })
    }
  })

  const onSubmitCustomer = (data: InsertCustomer) => {
    createCustomerMutation.mutate(data)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const handleViewProfile = (customerId: string) => {
    console.log('View profile for customer:', customerId)
    // TODO: Implement customer profile drawer
  }

  const handleEditCustomer = (customerId: string) => {
    console.log('Edit customer:', customerId)
    // TODO: Implement edit customer modal
  }

  const handleDeleteCustomer = (customerId: string) => {
    console.log('Delete customer:', customerId)
    // TODO: Implement delete confirmation
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">
          Customer Management
        </h1>
        <Dialog open={isAddModalOpen} onOpenChange={(open) => {
          setIsAddModalOpen(open)
          if (!open) {
            form.reset()
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground" data-testid="button-add-customer">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCustomer)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter customer name" 
                            {...field} 
                            data-testid="input-customer-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="customer@example.com" 
                            {...field} 
                            data-testid="input-customer-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+1 (555) 123-4567" 
                            {...field} 
                            data-testid="input-customer-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="City name" 
                            {...field} 
                            data-testid="input-customer-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter full address" 
                          {...field} 
                          data-testid="input-customer-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Country name" 
                          {...field} 
                          data-testid="input-customer-country"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    data-testid="button-cancel-customer"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCustomerMutation.isPending}
                    data-testid="button-submit-customer"
                  >
                    {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-customers">
              {customers.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-active-customers">
              {customersWithStats.filter(c => c.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-revenue">
              {formatCurrency(customersWithStats.reduce((sum, c) => sum + c.totalSpend, 0))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customers</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[250px]"
                  data-testid="input-search-customers"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading customers...</p>
            </div>
          ) : customersWithStats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="no-customers-message">
                {searchTerm ? "No customers found matching your search." : "No customers found. Add your first customer to get started."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Total Spend</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customersWithStats.map((customer) => (
                  <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                    <TableCell className="font-mono text-sm" data-testid={`text-customer-id-${customer.id}`}>
                      {customer.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-customer-name-${customer.id}`}>
                      {customer.name}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span data-testid={`text-customer-email-${customer.id}`}>{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span data-testid={`text-customer-phone-${customer.id}`}>{customer.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div data-testid={`text-customer-city-${customer.id}`}>{customer.city}</div>
                        <div className="text-muted-foreground" data-testid={`text-customer-country-${customer.id}`}>{customer.country}</div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-customer-orders-${customer.id}`}>
                      {customer.totalOrders}
                    </TableCell>
                    <TableCell data-testid={`text-customer-spend-${customer.id}`}>
                      {formatCurrency(customer.totalSpend)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={customer.status === "active" ? "default" : "secondary"}
                        data-testid={`badge-customer-status-${customer.id}`}
                      >
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            data-testid={`button-customer-actions-${customer.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleViewProfile(customer.id)}
                            data-testid={`button-view-profile-${customer.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleEditCustomer(customer.id)}
                            data-testid={`button-edit-customer-${customer.id}`}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-destructive"
                            data-testid={`button-delete-customer-${customer.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}