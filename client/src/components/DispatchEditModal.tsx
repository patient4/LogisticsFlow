import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

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
  customer: Customer
  carrier: Carrier
  driver?: Driver
  order: Order
}

interface DispatchEditModalProps {
  dispatch: Dispatch | null
  isOpen: boolean
  onClose: () => void
}

// Define the update schema based on what can be edited
const dispatchUpdateSchema = z.object({
  carrierId: z.string().optional(),
  driverId: z.string().optional(),
  rate: z.string().min(1, "Rate is required"),
  currency: z.enum(["USD", "CAD", "EUR", "GBP"]),
  poNumber: z.string().optional(),
  carrierMobile: z.string().optional(),
  dispatchStatus: z.enum(["pending", "heading_for_pickup", "at_pickup", "in_transit", "at_delivery", "delivered"]),
  notes: z.string().optional(),
})

type DispatchUpdateData = z.infer<typeof dispatchUpdateSchema>

export function DispatchEditModal({ dispatch, isOpen, onClose }: DispatchEditModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch carriers for dropdown
  const { data: carriers = [], isLoading: carriesLoading } = useQuery<Carrier[]>({
    queryKey: ['/api/carriers'],
  })

  // Fetch drivers for dropdown
  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ['/api/drivers'],
  })

  const form = useForm<DispatchUpdateData>({
    resolver: zodResolver(dispatchUpdateSchema),
    defaultValues: {
      carrierId: "",
      driverId: "",
      rate: "",
      currency: "USD",
      poNumber: "",
      carrierMobile: "",
      dispatchStatus: "pending",
      notes: "",
    },
  })

  // Reset form when dispatch changes
  useEffect(() => {
    if (dispatch) {
      form.reset({
        carrierId: dispatch.carrierId,
        driverId: dispatch.driverId || "",
        rate: dispatch.rate,
        currency: dispatch.currency as any,
        poNumber: dispatch.poNumber || "",
        carrierMobile: dispatch.carrierMobile || "",
        dispatchStatus: dispatch.dispatchStatus as any,
        notes: dispatch.notes || "",
      })
    }
  }, [dispatch, form])

  // Update mutation
  const updateDispatchMutation = useMutation({
    mutationFn: async (data: DispatchUpdateData) => {
      if (!dispatch) throw new Error("No dispatch to update")
      
      // Remove empty optional fields and handle special values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([key, value]) => {
          // Filter out empty strings and undefined values
          if (value === "" || value === undefined) return false
          // Convert "unassigned" back to undefined for driverId
          if (key === "driverId" && value === "unassigned") return false
          return true
        })
      )
      
      return apiRequest('PATCH', `/api/dispatches/${dispatch.id}`, cleanData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dispatches'] })
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/orders' })
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] })
      toast({
        title: "Success",
        description: "Dispatch updated successfully.",
      })
      onClose()
    },
    onError: (error: any) => {
      console.error('Update dispatch error:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to update dispatch",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (data: DispatchUpdateData) => {
    updateDispatchMutation.mutate(data)
  }

  // Filter drivers by selected carrier
  const availableDrivers = drivers.filter((driver: Driver) => 
    driver.isActive && (!form.watch().carrierId || driver.carrierId === form.watch().carrierId)
  )
  if (!dispatch) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Dispatch #{dispatch.dispatchNumber}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Order Information (Read-only) */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-semibold mb-2">Order Information (Read-only)</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Order Number:</span> {dispatch.order.orderNumber}
                </div>
                <div>
                  <span className="font-medium">Customer:</span> {dispatch.customer.name}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Pickup:</span> {dispatch.order.pickupAddress}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Delivery:</span> {dispatch.order.deliveryAddress}
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dispatchStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dispatch Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-dispatch-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="heading_for_pickup">Heading for Pickup</SelectItem>
                        <SelectItem value="at_pickup">At Pickup</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="at_delivery">At Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carrierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-carrier">
                          <SelectValue placeholder="Select carrier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {carriesLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          carriers.filter((carrier) => carrier.isActive).map((carrier) => (
                            <SelectItem key={carrier.id} value={carrier.id}>
                              {carrier.name} ({carrier.code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="driverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-driver">
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">No driver assigned</SelectItem>
                        {driversLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          availableDrivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.name} - {driver.vehicleType} ({driver.currentStatus})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carrierMobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrier Mobile (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter carrier mobile number"
                        data-testid="input-carrier-mobile"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue placeholder="Currency" />
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

              <FormField
                control={form.control}
                name="poNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO Number (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter PO number"
                        data-testid="input-po-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter additional notes for this dispatch"
                      rows={3}
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateDispatchMutation.isPending}
                data-testid="button-save-dispatch"
              >
                {updateDispatchMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}