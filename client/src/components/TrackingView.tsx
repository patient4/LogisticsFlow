import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, ArrowLeft, MapPin, Package, Clock, CheckCircle } from "lucide-react"
import truckImage from "@assets/generated_images/Isometric_delivery_truck_illustration_8448972c.png"

interface Driver {
  id: string
  name: string
  initials: string
  company: string
  status: "on the way" | "loading" | "waiting" | "delivered"
}

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
}

interface TrackingViewProps {
  orderId?: string
}

export function TrackingView({ orderId }: TrackingViewProps) {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [updateFormData, setUpdateFormData] = useState({
    status: "on the way", // Default to valid status
    location: "",
    estimatedDelivery: "",
    notes: ""
  })

  // Fetch order data when orderId is provided
  const { data: order, isLoading: isLoadingOrder } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required')
      const response = await apiRequest('GET', `/api/orders/${orderId}`)
      const data = await response.json()
      return data as Order
    },
    enabled: !!orderId
  })

  // TODO: Replace with real driver tracking data - for now use mock data
  const [drivers, setDrivers] = useState<Driver[]>([
    { id: "JD", name: "John Doe", initials: "JD", company: "Express Transport", status: "on the way" },
    { id: "JS", name: "Jane Smith", initials: "JS", company: "QuickShip Benz Metro", status: "loading" },
    { id: "MJ", name: "Mike Johnson", initials: "MJ", company: "LogiMove", status: "waiting" },
    { id: "ED", name: "Emily Davis", initials: "ED", company: "Fast Freight", status: "on the way" },
    { id: "CL", name: "Chris Lee", initials: "CL", company: "Rapid Haul", status: "delivered" },
  ])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "on the way":
        return "default"
      case "loading":
        return "default"
      case "waiting":
        return "secondary"
      case "delivered":
        return "default"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on the way":
        return "text-blue-700 bg-blue-100 border-blue-200"
      case "loading":
        return "text-yellow-800 bg-yellow-100 border-yellow-200"
      case "waiting":
        return "text-orange-700 bg-orange-100 border-orange-200"
      case "delivered":
        return "text-green-700 bg-green-100 border-green-200"
      default:
        return "text-gray-600 bg-gray-100 border-gray-200"
    }
  }

  const handleUpdateTracking = () => {
    if (selectedDriver) {
      setUpdateFormData({
        status: selectedDriver.status || "on the way", // Ensure non-empty status
        location: "",
        estimatedDelivery: "",
        notes: ""
      })
      setIsUpdateModalOpen(true)
    }
  }

  const handleSaveUpdate = () => {
    if (selectedDriver) {
      // Update the driver's status in local state
      setDrivers(prev => prev.map(driver => 
        driver.id === selectedDriver.id 
          ? { ...driver, status: updateFormData.status as Driver['status'] }
          : driver
      ))
      
      // Update the selected driver to reflect new status
      setSelectedDriver(prev => prev ? { ...prev, status: updateFormData.status as Driver['status'] } : null)
      
      // TODO: Implement API call to update tracking  
      console.log("Saving tracking update:", updateFormData)
    }
    
    setIsUpdateModalOpen(false)
    // Reset form
    setUpdateFormData({
      status: "on the way",
      location: "",
      estimatedDelivery: "",
      notes: ""
    })
  }

  const handleDriverSelect = (driver: Driver) => {
    setSelectedDriver(driver)
    console.log(`Selected driver: ${driver.name}`)
  }

  // Show loading state when fetching order
  if (orderId && isLoadingOrder) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading order details...</div>
      </div>
    )
  }

  // Show order-specific tracking when order is loaded
  if (orderId && order) {
    return (
      <div className="space-y-6">
        {/* Order Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order {order.orderNumber}</span>
              <Badge variant={order.orderStatus === 'delivered' ? 'default' : 'secondary'} className={getStatusColor(order.orderStatus)}>
                {order.orderStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer</label>
                <p className="font-medium">{order.customer.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Pickup</label>
                <p className="text-sm">{order.pickupAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Delivery</label>
                <p className="text-sm">{order.deliveryAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Amount</label>
                <p className="font-medium">${Number(order.amount).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Tracker */}
        <Card>
          <CardHeader>
            <CardTitle>Order Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between relative">
              {["pending", "processing", "shipped", "in_transit", "delivered"].map((status, index, array) => {
                const isCurrent = order.orderStatus === status
                const isPast = array.indexOf(order.orderStatus) > index
                const isCancelled = order.orderStatus === 'cancelled'
                
                return (
                  <div key={status} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isCancelled ? 'bg-destructive text-destructive-foreground' :
                      isPast || isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isPast ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                    <span className="text-xs mt-2 capitalize text-center">{status.replace('_', ' ')}</span>
                    {index < array.length - 1 && (
                      <div className={`absolute top-4 h-0.5 ${
                        isPast ? 'bg-primary' : 'bg-muted'
                      }`} style={{
                        left: `${((index + 1) / array.length) * 100}%`,
                        width: `${(1 / array.length) * 100}%`
                      }} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Driver Assignment - only show if we have drivers */}
        {drivers.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Drivers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover-elevate ${
                      selectedDriver?.id === driver.id ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted/50"
                    }`}
                    onClick={() => handleDriverSelect(driver)}
                    data-testid={`driver-card-${driver.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                            {driver.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{driver.name}</p>
                          <p className="text-sm text-muted-foreground">{driver.company}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(driver.status)} className={getStatusColor(driver.status)}>
                        {driver.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {selectedDriver && (
              <Card>
                <CardHeader>
                  <CardTitle>Driver Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                          {selectedDriver.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-lg">{selectedDriver.name}</p>
                        <p className="text-muted-foreground">{selectedDriver.company}</p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => setIsUpdateModalOpen(true)}
                      className="w-full"
                      data-testid="button-update-tracking"
                    >
                      Update Tracking Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    )
  }

  // Show default driver list view when no order is selected
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Panel - Drivers List */}
      <Card className="flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-driver-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-4 overflow-y-auto">
          {drivers
            .filter(driver => 
              driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              driver.company.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((driver) => (
            <div
              key={driver.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors hover-elevate ${
                selectedDriver?.id === driver.id ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted/50"
              }`}
              onClick={() => handleDriverSelect(driver)}
              data-testid={`driver-card-${driver.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {driver.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground" data-testid={`driver-name-${driver.id}`}>
                      {driver.name}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`driver-company-${driver.id}`}>
                      {driver.company}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={getStatusVariant(driver.status)}
                  className={getStatusColor(driver.status)}
                  data-testid={`driver-status-${driver.id}`}
                >
                  {driver.status}
                </Badge>
              </div>
            </div>
          ))}

          <div className="pt-6 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => console.log("Add new vehicle triggered")}
              data-testid="button-add-vehicle"
            >
              Add New Vehicle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Right Panel - Truck Details and Customer Info */}
      <div className="space-y-6">
        {selectedDriver ? (
          <>
            {/* Truck Information Card */}
            <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                        {selectedDriver.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg text-foreground" data-testid="selected-driver-name">
                        {selectedDriver.name}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid="selected-driver-phone">
                        ID: 2508-542-007
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-primary text-primary-foreground mb-2" data-testid="truck-id">
                      TRK-588
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-foreground hover:bg-background/50"
                      onClick={() => console.log("Back to home triggered")}
                      data-testid="button-back-home"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to home
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2" data-testid="truck-type">
                        Heavy Duty Truck
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Payload</p>
                          <p className="font-semibold text-foreground" data-testid="truck-payload">
                            40,000 lbs
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Load Volume</p>
                          <p className="font-semibold text-foreground" data-testid="truck-volume">
                            3,500 ft³
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Load Length</p>
                          <p className="font-semibold text-foreground" data-testid="truck-length">
                            53 ft
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Load Width</p>
                          <p className="font-semibold text-foreground" data-testid="truck-width">
                            8.5 ft
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <img
                      src={truckImage}
                      alt="Delivery Truck"
                      className="w-48 h-32 object-contain"
                      data-testid="truck-image"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Details Card */}
            <Card>
              <CardHeader className="bg-primary/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-primary" data-testid="customer-details-title">
                    Customer Details
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpdateTracking}
                    data-testid="button-update-tracking"
                    disabled={!selectedDriver}
                  >
                    Update Tracking
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Name:</p>
                    <p className="font-semibold text-foreground" data-testid="customer-name">
                      {customerDetails.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email Address:</p>
                    <p className="font-semibold text-foreground" data-testid="customer-email">
                      {customerDetails.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Number:</p>
                    <p className="font-semibold text-foreground" data-testid="customer-phone">
                      {customerDetails.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Address:</p>
                    <p className="font-semibold text-foreground" data-testid="customer-address">
                      {customerDetails.address}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-600" data-testid="pickup-label">
                        Pickup
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid="pickup-address">
                      123 Industrial way, Distribution, UK india
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid="pickup-date">
                      Date: 9/7/2025
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-semibold text-red-600" data-testid="dropoff-label">
                        Drop-off
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid="dropoff-address">
                      123 Industrial way, Distribution, UK india
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid="dropoff-date">
                      Date: 9/8/2025
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p data-testid="select-driver-message">
                  Select a driver from the list to view tracking details
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Update Tracking Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-[425px]" data-testid="tracking-update-form">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Update Tracking - {selectedDriver?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Delivery Status</Label>
              <Select
                value={updateFormData.status}
                onValueChange={(value) => setUpdateFormData({...updateFormData, status: value})}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on the way">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      On the way
                    </div>
                  </SelectItem>
                  <SelectItem value="loading">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-yellow-600" />
                      Loading
                    </div>
                  </SelectItem>
                  <SelectItem value="waiting">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      Waiting
                    </div>
                  </SelectItem>
                  <SelectItem value="delivered">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Delivered
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Current Location</Label>
              <Input
                id="location"
                value={updateFormData.location}
                onChange={(e) => setUpdateFormData({...updateFormData, location: e.target.value})}
                placeholder="Enter current location"
                data-testid="input-location"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimated-delivery">Estimated Delivery</Label>
              <Input
                id="estimated-delivery"
                type="datetime-local"
                value={updateFormData.estimatedDelivery}
                onChange={(e) => setUpdateFormData({...updateFormData, estimatedDelivery: e.target.value})}
                data-testid="input-estimated-delivery"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={updateFormData.notes}
                onChange={(e) => setUpdateFormData({...updateFormData, notes: e.target.value})}
                placeholder="Add any additional notes..."
                rows={3}
                data-testid="textarea-notes"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsUpdateModalOpen(false)}
              data-testid="button-cancel-update"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUpdate}
              data-testid="button-save-update"
            >
              Save Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}