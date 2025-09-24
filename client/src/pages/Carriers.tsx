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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Edit, 
  Trash2,
  Truck,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Building,
  Contact
} from "lucide-react"
import type { Carrier, InsertCarrier } from "@/../../shared/schema"
import { insertCarrierSchema } from "@/../../shared/schema"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"

// Extended carrier type with statistics
interface CarrierWithStats extends Carrier {
  totalDrivers: number
  totalOrders: number
  isActive: boolean
}

export default function Carriers() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null)
  const { toast } = useToast()

  // Form for adding/editing carrier
  const form = useForm<InsertCarrier>({
    resolver: zodResolver(insertCarrierSchema),
    defaultValues: {
      name: "",
      code: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      mobile: "",
      ratePerMile: undefined,
      ratePerKm: undefined,
      defaultCurrency: "USD",
      serviceAreas: [],
      isActive: true
    }
  })

  // Fetch carriers with search functionality
  const { data: carriers = [], isLoading: isLoadingCarriers } = useQuery({
    queryKey: ['/api/carriers', searchTerm],
    queryFn: async () => {
      const url = searchTerm 
        ? `/api/carriers?search=${encodeURIComponent(searchTerm)}`
        : '/api/carriers'
      const response = await apiRequest('GET', url)
      const data = await response.json()
      return data as Carrier[]
    }
  })

  // Fetch drivers to calculate carrier statistics
  const { data: drivers = [], isLoading: isLoadingDrivers } = useQuery({
    queryKey: ['/api/drivers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/drivers')
      const data = await response.json()
      return data as any[]
    }
  })

  // Fetch orders to calculate carrier statistics
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders', 'limit=1000'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders?limit=1000')
      const data = await response.json()
      return data as any[]
    }
  })

  // Calculate carrier statistics
  const carriersWithStats: CarrierWithStats[] = useMemo(() => {
    return carriers.map(carrier => {
      const carrierDrivers = drivers.filter(driver => driver.carrierId === carrier.id)
      const carrierOrders = orders.filter(order => order.carrierId === carrier.id)
      
      return {
        ...carrier,
        totalDrivers: carrierDrivers.length,
        totalOrders: carrierOrders.length,
        isActive: carrier.isActive || false
      }
    })
  }, [carriers, drivers, orders])

  const isLoading = isLoadingCarriers || isLoadingDrivers || isLoadingOrders

  // Create/update carrier mutation
  const saveCarrierMutation = useMutation({
    mutationFn: async (carrierData: InsertCarrier & { id?: string }) => {
      if (editingCarrier) {
        return apiRequest('PUT', `/api/carriers/${editingCarrier.id}`, carrierData)
      } else {
        return apiRequest('POST', '/api/carriers', carrierData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === '/api/carriers'
      })
      toast({
        title: editingCarrier ? "Carrier Updated" : "Carrier Created",
        description: editingCarrier ? "Carrier has been successfully updated." : "New carrier has been successfully added.",
      })
      form.reset()
      setIsAddModalOpen(false)
      setEditingCarrier(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingCarrier ? 'update' : 'create'} carrier`,
        variant: "destructive",
      })
    }
  })

  // Delete carrier mutation
  const deleteCarrierMutation = useMutation({
    mutationFn: async (carrierId: string) => {
      return apiRequest('DELETE', `/api/carriers/${carrierId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === '/api/carriers'
      })
      toast({
        title: "Carrier Deleted",
        description: "Carrier has been successfully deleted.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete carrier",
        variant: "destructive",
      })
    }
  })

  const onSubmitCarrier = (data: InsertCarrier) => {
    saveCarrierMutation.mutate(data)
  }

  const formatCurrency = (amount: number | null, currency: string = "USD") => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const handleEditCarrier = (carrier: Carrier) => {
    setEditingCarrier(carrier)
    form.reset({
      name: carrier.name,
      code: carrier.code,
      contactPerson: carrier.contactPerson,
      contactEmail: carrier.contactEmail,
      contactPhone: carrier.contactPhone,
      mobile: carrier.mobile,
      ratePerMile: carrier.ratePerMile ? carrier.ratePerMile.toString() : undefined,
      ratePerKm: carrier.ratePerKm ? carrier.ratePerKm.toString() : undefined,
      defaultCurrency: carrier.defaultCurrency,
      serviceAreas: carrier.serviceAreas || [],
      isActive: carrier.isActive
    })
    setIsAddModalOpen(true)
  }

  const handleDeleteCarrier = (carrierId: string) => {
    if (confirm("Are you sure you want to delete this carrier? This action cannot be undone.")) {
      deleteCarrierMutation.mutate(carrierId)
    }
  }

  const handleModalClose = (open: boolean) => {
    setIsAddModalOpen(open)
    if (!open) {
      form.reset()
      setEditingCarrier(null)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">
          Carrier Management
        </h1>
        <Dialog open={isAddModalOpen} onOpenChange={handleModalClose}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground" data-testid="button-add-carrier">
              <Plus className="w-4 h-4 mr-2" />
              Add Carrier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{editingCarrier ? "Edit Carrier" : "Add New Carrier"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCarrier)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carrier Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter carrier name" 
                            {...field} 
                            data-testid="input-carrier-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carrier Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., ABC123" 
                            {...field} 
                            data-testid="input-carrier-code"
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
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Contact person name" 
                            {...field} 
                            data-testid="input-contact-person"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="carrier@example.com" 
                            {...field} 
                            data-testid="input-carrier-email"
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
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+1 (555) 123-4567" 
                            {...field} 
                            data-testid="input-carrier-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+1 (555) 987-6543" 
                            {...field} 
                            data-testid="input-carrier-mobile"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="ratePerMile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate per Mile</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="2.50" 
                            {...field} 
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value || undefined)}
                            data-testid="input-rate-per-mile"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ratePerKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate per KM</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="1.55" 
                            {...field} 
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value || undefined)}
                            data-testid="input-rate-per-km"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-default-currency">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleModalClose(false)}
                    data-testid="button-cancel-carrier"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveCarrierMutation.isPending}
                    data-testid="button-submit-carrier"
                  >
                    {saveCarrierMutation.isPending ? "Saving..." : editingCarrier ? "Update Carrier" : "Create Carrier"}
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
            <CardTitle className="text-sm font-medium">Total Carriers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-carriers">
              {carriers.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Carriers</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-active-carriers">
              {carriersWithStats.filter(c => c.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Contact className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-drivers">
              {carriersWithStats.reduce((sum, c) => sum + c.totalDrivers, 0)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Carriers</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search carriers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[250px]"
                  data-testid="input-search-carriers"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading carriers...</p>
            </div>
          ) : carriersWithStats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="no-carriers-message">
                {searchTerm ? "No carriers found matching your search." : "No carriers found. Add your first carrier to get started."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rate per Mile/KM</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carriersWithStats.map((carrier) => (
                  <TableRow key={carrier.id} data-testid={`row-carrier-${carrier.id}`}>
                    <TableCell className="font-mono text-sm" data-testid={`text-carrier-id-${carrier.id}`}>
                      {carrier.code}
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-carrier-name-${carrier.id}`}>
                      {carrier.name}
                    </TableCell>
                    <TableCell data-testid={`text-contact-person-${carrier.id}`}>
                      {carrier.contactPerson}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span data-testid={`text-carrier-mobile-${carrier.id}`}>{carrier.mobile}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span data-testid={`text-carrier-email-${carrier.id}`}>{carrier.contactEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-carrier-rates-${carrier.id}`}>
                      <div className="text-sm space-y-1">
                        <div>{formatCurrency(carrier.ratePerMile ? parseFloat(carrier.ratePerMile.toString()) : 0, carrier.defaultCurrency)}/mi</div>
                        <div className="text-muted-foreground">{formatCurrency(carrier.ratePerKm ? parseFloat(carrier.ratePerKm.toString()) : 0, carrier.defaultCurrency)}/km</div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-carrier-currency-${carrier.id}`}>
                      {carrier.defaultCurrency}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={carrier.isActive ? "default" : "secondary"}
                        data-testid={`badge-carrier-status-${carrier.id}`}
                      >
                        {carrier.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            data-testid={`button-carrier-actions-${carrier.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleEditCarrier(carrier)}
                            data-testid={`button-edit-carrier-${carrier.id}`}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Carrier
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCarrier(carrier.id)}
                            className="text-destructive"
                            data-testid={`button-delete-carrier-${carrier.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Carrier
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