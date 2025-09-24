import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ArrowLeft } from "lucide-react"

interface CreateOrderModalProps {
  trigger?: React.ReactNode
}

export function CreateOrderModal({ trigger }: CreateOrderModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleSubmit = () => {
    console.log("Order submission triggered")
    setIsOpen(false)
  }

  const handleBackToOrders = () => {
    console.log("Back to orders triggered")
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-create-order-modal">
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg -m-6 mb-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl" data-testid="modal-title">
              Create Order
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToOrders}
              className="text-primary-foreground hover:bg-primary/80"
              data-testid="button-back-to-orders"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Details Section */}
          <Card>
            <CardHeader className="bg-primary/10">
              <CardTitle className="text-primary" data-testid="section-order-details">
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Customer Name</Label>
                  <Input id="customer-name" data-testid="input-customer-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" data-testid="input-address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" data-testid="input-phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" data-testid="input-city" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" data-testid="input-country" />
              </div>
            </CardContent>
          </Card>

          {/* Pickup Location Section */}
          <Card>
            <CardHeader className="bg-primary/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-primary" data-testid="section-pickup-location">
                  Pickup Location(s)
                </CardTitle>
                <Button variant="outline" size="sm" data-testid="button-add-pickup">
                  <Plus className="w-4 h-4 mr-2" />
                  Add More Pickups
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup-location">Pickup Location</Label>
                  <Input id="pickup-location" data-testid="input-pickup-location" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup-po-number">Pickup PO Number</Label>
                  <Input id="pickup-po-number" placeholder="PO-12345" data-testid="input-pickup-po-number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reel">Reel</Label>
                  <Input id="reel" placeholder="0 KG" data-testid="input-reel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst">GST (%)</Label>
                  <Input id="gst" placeholder="0" data-testid="input-gst" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Palettes Section */}
          <Card>
            <CardHeader className="bg-primary/10">
              <CardTitle className="text-primary" data-testid="section-palettes">
                Palettes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="num-palettes">No. Of Palettes</Label>
                  <Input id="num-palettes" placeholder="mm/dd/yyyy" data-testid="input-num-palettes" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight-pallets">Weight Of Pallets</Label>
                  <Input id="weight-pallets" placeholder="mm/dd/yyyy" data-testid="input-weight-pallets" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length">Length</Label>
                  <Input id="length" data-testid="input-length" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Input id="width" data-testid="input-width" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Input id="height" data-testid="input-height" />
              </div>
            </CardContent>
          </Card>

          {/* Date & Delivery Section */}
          <Card>
            <CardHeader className="bg-primary/10">
              <CardTitle className="text-primary" data-testid="section-date-delivery">
                Date & Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup-date">Date of pickup</Label>
                  <Input 
                    id="pickup-date" 
                    type="date"
                    placeholder="mm/dd/yyyy" 
                    data-testid="input-pickup-date" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drop-date">Date of Drop</Label>
                  <Input 
                    id="drop-date" 
                    type="date"
                    placeholder="mm/dd/yyyy" 
                    data-testid="input-drop-date" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup-time">Time of pickup</Label>
                  <Input 
                    id="pickup-time" 
                    type="time"
                    data-testid="input-pickup-time" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drop-time">Time of Drop</Label>
                  <Input 
                    id="drop-time" 
                    type="time"
                    data-testid="input-drop-time" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery-address">Delivery Address</Label>
                  <Input id="delivery-address" data-testid="input-delivery-address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-po-number">Delivery PO Number</Label>
                  <Input id="delivery-po-number" placeholder="PO-67890" data-testid="input-delivery-po-number" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing & Status Section */}
          <Card>
            <CardHeader className="bg-primary/10">
              <CardTitle className="text-primary" data-testid="section-billing-status">
                Billing & Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" placeholder="$0.00" data-testid="input-amount" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carrier">Carrier</Label>
                  <Select data-testid="select-carrier">
                    <SelectTrigger>
                      <SelectValue placeholder="FedEx" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fedex">FedEx</SelectItem>
                      <SelectItem value="ups">UPS</SelectItem>
                      <SelectItem value="dhl">DHL</SelectItem>
                      <SelectItem value="usps">USPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-status">Payment Status</Label>
                  <Select data-testid="select-payment-status">
                    <SelectTrigger>
                      <SelectValue placeholder="Paid" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order-status">Order Status</Label>
                  <Select data-testid="select-order-status">
                    <SelectTrigger>
                      <SelectValue placeholder="Shipped" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSubmit} className="bg-primary text-primary-foreground" data-testid="button-submit-order">
              Create Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}