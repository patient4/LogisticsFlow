import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, ArrowLeft, MapPin } from "lucide-react"
import truckImage from "@assets/generated_images/Isometric_delivery_truck_illustration_8448972c.png"

interface Driver {
  id: string
  name: string
  initials: string
  company: string
  status: "on the way" | "loading" | "waiting" | "delivered"
}

interface CustomerDetail {
  name: string
  email: string
  phone: string
  address: string
}

export function TrackingView() {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // TODO: Remove mock data - replace with real driver tracking data
  const drivers: Driver[] = [
    { id: "JD", name: "John Doe", initials: "JD", company: "Express Transport", status: "on the way" },
    { id: "JS", name: "Jane Smith", initials: "JS", company: "QuickShip Benz Metro", status: "loading" },
    { id: "MJ", name: "Mike Johnson", initials: "MJ", company: "LogiMove", status: "waiting" },
    { id: "ED", name: "Emily Davis", initials: "ED", company: "Fast Freight", status: "on the way" },
    { id: "CL", name: "Chris Lee", initials: "CL", company: "Rapid Haul", status: "delivered" },
  ]

  // TODO: Remove mock data - replace with real customer data
  const customerDetails: CustomerDetail = {
    name: "Dhruv Sharma",
    email: "Sharmadhruv047@gmail.com",
    phone: "916 B273467588",
    address: "Teachers colony govind garh",
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "on the way":
        return "default"
      case "loading":
        return "secondary"
      case "waiting":
        return "outline"
      case "delivered":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on the way":
        return "text-blue-600"
      case "loading":
        return "text-yellow-600"
      case "waiting":
        return "text-orange-600"
      case "delivered":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const handleDriverSelect = (driver: Driver) => {
    setSelectedDriver(driver)
    console.log(`Selected driver: ${driver.name}`)
  }

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
                className="pl-10"
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
                    onClick={() => console.log("Update tracking triggered")}
                    data-testid="button-update-tracking"
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
    </div>
  )
}