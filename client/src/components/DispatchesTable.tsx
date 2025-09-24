import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, Search, Download, Eye, FileText } from "lucide-react"
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
  pickupAddress: string
  deliveryAddress: string
  pickupDate: string
  deliveryDate: string
}

interface Dispatch {
  id: string
  dispatchNumber: string
  orderId: string
  carrierId: string
  driverId?: string
  rate: string
  currency: "USD" | "CAD" | "EUR" | "GBP"
  poNumber?: string
  carrierMobile?: string
  dispatchStatus: "pending" | "heading_for_pickup" | "at_pickup" | "in_transit" | "at_delivery" | "delivered"
  notes?: string
  dispatchedAt: string
  updatedAt: string
  // Joined data
  order: Order
  customer: Customer
  carrier: Carrier
  driver?: Driver
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800"
    case "heading_for_pickup": return "bg-blue-100 text-blue-800"
    case "at_pickup": return "bg-purple-100 text-purple-800"
    case "in_transit": return "bg-orange-100 text-orange-800"
    case "at_delivery": return "bg-green-100 text-green-800"
    case "delivered": return "bg-emerald-100 text-emerald-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

export function DispatchesTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch dispatches
  const { data: dispatches = [], isLoading, error } = useQuery({
    queryKey: ['/api/dispatches'],
    enabled: true,
  })

  // Delete dispatch mutation
  const deleteDispatchMutation = useMutation({
    mutationFn: async (dispatchId: string) => {
      const response = await apiRequest('DELETE', `/api/dispatches/${dispatchId}`)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dispatches'] })
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] })
      toast({
        title: "Success",
        description: "Dispatch deleted successfully.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete dispatch",
        variant: "destructive",
      })
    }
  })

  // Filter dispatches based on search
  const filteredDispatches = dispatches.filter((dispatch: Dispatch) =>
    dispatch.dispatchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dispatch.dispatchStatus.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Error loading dispatches: {(error as Error).message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-foreground">
            Dispatches ({filteredDispatches.length})
          </CardTitle>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search dispatches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-dispatches"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading dispatches...</p>
          </div>
        ) : filteredDispatches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchQuery ? "No dispatches found matching your search." : "No dispatches found."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispatch ID</TableHead>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Carrier Name</TableHead>
                  <TableHead>Driver Info</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Rate & Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDispatches.map((dispatch: Dispatch) => (
                  <TableRow key={dispatch.id}>
                    <TableCell className="font-medium" data-testid={`text-dispatch-id-${dispatch.id}`}>
                      {dispatch.dispatchNumber}
                    </TableCell>
                    <TableCell data-testid={`text-order-number-${dispatch.id}`}>
                      <span className="font-medium text-foreground">
                        {dispatch.order.orderNumber}
                      </span>
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
                      <div className="max-w-xs truncate" title={dispatch.order.pickupAddress}>
                        {dispatch.order.pickupAddress}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-delivery-${dispatch.id}`}>
                      <div className="max-w-xs truncate" title={dispatch.order.deliveryAddress}>
                        {dispatch.order.deliveryAddress}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-rate-${dispatch.id}`}>
                      {dispatch.currency} {dispatch.rate}
                    </TableCell>
                    <TableCell data-testid={`badge-status-${dispatch.id}`}>
                      <Badge className={getStatusColor(dispatch.dispatchStatus)}>
                        {dispatch.dispatchStatus.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement PDF preview
                            toast({
                              title: "Coming Soon",
                              description: "PDF preview functionality will be implemented",
                            })
                          }}
                          data-testid={`button-preview-pdf-${dispatch.id}`}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement update dispatch
                            toast({
                              title: "Coming Soon",
                              description: "Update dispatch functionality will be implemented",
                            })
                          }}
                          data-testid={`button-edit-${dispatch.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-${dispatch.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Dispatch</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete dispatch {dispatch.dispatchNumber}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteDispatchMutation.mutate(dispatch.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-testid={`button-confirm-delete-${dispatch.id}`}
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}