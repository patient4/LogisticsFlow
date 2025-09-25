import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Edit, MapPin, Clock, Package, CheckCircle, Truck } from "lucide-react"
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
  contactPerson: string
  contactEmail: string
  contactPhone: string
  mobile: string
  serviceAreas: string[]
  isActive: boolean
}

interface Driver {
  id: string
  name: string
  phone: string
  licenseNumber: string
  carrierId?: string
  vehicleType: string
  currentStatus: "available" | "on_the_way" | "loading" | "waiting" | "delivered"
  isActive: boolean
}

interface Order {
  id: string
  orderNumber: string
  pickupAddress: string
  deliveryAddress: string
  pickupDate: string
  deliveryDate: string
  status: "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled"
  notes?: string
}

interface Dispatch {
  id: string
  dispatchNumber: string
  orderId: string
  carrierId: string
  driverId?: string
  rate: string
  currency: string
  poNumber?: string
  carrierMobile?: string
  dispatchStatus: "pending" | "heading_for_pickup" | "at_pickup" | "in_transit" | "at_delivery" | "delivered"
  notes?: string
  dispatchedAt: string
  updatedAt: string
  customer: Customer
  carrier: Carrier
  driver?: Driver
  order: Order
}

interface TrackingUpdateData {
  dispatchStatus: "pending" | "heading_for_pickup" | "at_pickup" | "in_transit" | "at_delivery" | "delivered"
  notes?: string
}

export function TrackingTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null)
  const [updateData, setUpdateData] = useState<TrackingUpdateData>({
    dispatchStatus: "pending",
    notes: "",
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch all dispatches for tracking table
  const { data: dispatches = [], isLoading, error } = useQuery<Dispatch[]>({
    queryKey: ['/api/dispatches'],
  })

  // Update tracking mutation
  const updateTrackingMutation = useMutation({
    mutationFn: async (data: { id: string; updateData: TrackingUpdateData }) => {
      return apiRequest('PATCH', `/api/dispatches/${data.id}`, data.updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dispatches'] })
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/orders' })
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] })
      toast({
        title: "Success",
        description: "Tracking status updated successfully.",
      })
      setUpdateModalOpen(false)
      setSelectedDispatch(null)
    },
    onError: (error: any) => {
      console.error('Update tracking error:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to update tracking status",
        variant: "destructive",
      })
    },
  })

  // Filter dispatches based on search
  const filteredDispatches = dispatches.filter((dispatch: Dispatch) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      dispatch.order.orderNumber.toLowerCase().includes(searchLower) ||
      dispatch.customer.name.toLowerCase().includes(searchLower) ||
      dispatch.carrier.name.toLowerCase().includes(searchLower) ||
      (dispatch.driver?.name || "").toLowerCase().includes(searchLower) ||
      (dispatch.poNumber || "").toLowerCase().includes(searchLower) ||
      dispatch.dispatchStatus.toLowerCase().includes(searchLower)
    )
  })

  // Status color utility
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return "bg-gray-100 text-gray-800"
      case 'heading_for_pickup': return "bg-blue-100 text-blue-800"
      case 'at_pickup': return "bg-yellow-100 text-yellow-800"
      case 'in_transit': return "bg-purple-100 text-purple-800"
      case 'at_delivery': return "bg-orange-100 text-orange-800"
      case 'delivered': return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // Status icon utility
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'heading_for_pickup': return <Truck className="w-4 h-4" />
      case 'at_pickup': return <MapPin className="w-4 h-4" />
      case 'in_transit': return <Package className="w-4 h-4" />
      case 'at_delivery': return <MapPin className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  // Format status text
  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Calculate ETA (estimated delivery time)
  const calculateETA = (dispatch: Dispatch) => {
    if (dispatch.dispatchStatus === 'delivered') {
      return "Delivered"
    }
    
    const deliveryDate = new Date(dispatch.order.deliveryDate)
    const now = new Date()
    
    if (deliveryDate < now) {
      return "Overdue"
    }
    
    const diffTime = deliveryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return "Today"
    } else if (diffDays === 1) {
      return "Tomorrow"
    } else {
      return `${diffDays} days`
    }
  }

  // Handle update tracking
  const handleUpdateTracking = (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch)
    setUpdateData({
      dispatchStatus: dispatch.dispatchStatus as any,
      notes: dispatch.notes || "",
    })
    setUpdateModalOpen(true)
  }

  // Handle save update
  const handleSaveUpdate = () => {
    if (selectedDispatch) {
      updateTrackingMutation.mutate({
        id: selectedDispatch.id,
        updateData: updateData,
      })
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Error loading tracking data: {(error as Error).message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Tracking ({filteredDispatches.length})
          </CardTitle>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers, carriers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
                data-testid="input-search-tracking"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading tracking data...</p>
          </div>
        ) : filteredDispatches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchQuery ? "No tracking records found matching your search." : "No tracking data available."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order & PO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDispatches.map((dispatch: Dispatch) => (
                  <TableRow key={dispatch.id}>
                    <TableCell className="font-medium" data-testid={`text-order-po-${dispatch.id}`}>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">
                          {dispatch.order.orderNumber}
                        </div>
                        {dispatch.poNumber && (
                          <div className="text-sm text-muted-foreground">
                            PO: {dispatch.poNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-customer-${dispatch.id}`}>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{dispatch.customer.name}</div>
                        <div className="text-sm text-muted-foreground">{dispatch.customer.email}</div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-carrier-${dispatch.id}`}>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{dispatch.carrier.name}</div>
                        <div className="text-sm text-muted-foreground">{dispatch.carrier.code}</div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-driver-${dispatch.id}`}>
                      {dispatch.driver ? (
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">{dispatch.driver.name}</div>
                          <div className="text-sm text-muted-foreground">{dispatch.driver.phone}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-pickup-${dispatch.id}`}>
                      <div className="space-y-1">
                        <div className="max-w-xs truncate font-medium" title={dispatch.order.pickupAddress}>
                          {dispatch.order.pickupAddress}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(dispatch.order.pickupDate), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-delivery-${dispatch.id}`}>
                      <div className="space-y-1">
                        <div className="max-w-xs truncate font-medium" title={dispatch.order.deliveryAddress}>
                          {dispatch.order.deliveryAddress}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(dispatch.order.deliveryDate), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`badge-status-${dispatch.id}`}>
                      <Badge className={`${getStatusColor(dispatch.dispatchStatus)} flex items-center gap-1`}>
                        {getStatusIcon(dispatch.dispatchStatus)}
                        {formatStatus(dispatch.dispatchStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-eta-${dispatch.id}`}>
                      <span className={`font-medium ${
                        calculateETA(dispatch) === 'Overdue' ? 'text-red-600' : 
                        calculateETA(dispatch) === 'Today' ? 'text-orange-600' : 
                        'text-foreground'
                      }`}>
                        {calculateETA(dispatch)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateTracking(dispatch)}
                        className="flex items-center gap-1"
                        data-testid={`button-update-tracking-${dispatch.id}`}
                      >
                        <Edit className="w-4 h-4" />
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {/* Update Tracking Modal */}
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Update Tracking Status
            </DialogTitle>
          </DialogHeader>
          
          {selectedDispatch && (
            <div className="space-y-6">
              <div className="border rounded-lg p-3 bg-muted/50">
                <div className="text-sm font-medium text-foreground">
                  {selectedDispatch.order.orderNumber}
                  {selectedDispatch.poNumber && ` (PO: ${selectedDispatch.poNumber})`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedDispatch.customer.name}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dispatch Status</label>
                  <Select
                    value={updateData.dispatchStatus}
                    onValueChange={(value) => setUpdateData({
                      ...updateData,
                      dispatchStatus: value as any
                    })}
                  >
                    <SelectTrigger data-testid="select-dispatch-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Pending
                        </div>
                      </SelectItem>
                      <SelectItem value="heading_for_pickup">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          Heading for Pickup
                        </div>
                      </SelectItem>
                      <SelectItem value="at_pickup">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          At Pickup
                        </div>
                      </SelectItem>
                      <SelectItem value="in_transit">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          In Transit
                        </div>
                      </SelectItem>
                      <SelectItem value="at_delivery">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          At Delivery
                        </div>
                      </SelectItem>
                      <SelectItem value="delivered">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Delivered
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <textarea
                    value={updateData.notes}
                    onChange={(e) => setUpdateData({
                      ...updateData,
                      notes: e.target.value
                    })}
                    placeholder="Add tracking notes or updates..."
                    className="w-full p-2 border border-input rounded-md text-sm min-h-[80px] resize-none"
                    data-testid="textarea-tracking-notes"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setUpdateModalOpen(false)}
                  data-testid="button-cancel-tracking"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveUpdate}
                  disabled={updateTrackingMutation.isPending}
                  data-testid="button-save-tracking"
                >
                  {updateTrackingMutation.isPending ? "Saving..." : "Save Update"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}