// Emergency backup while fixing the broken file
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
import { PDFPreviewModal } from "./PDFPreviewModal"
import { generateDispatchHTML } from "@/lib/pdf-utils"

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
  serviceAreas: string[]
}

interface Driver {
  id: string
  name: string
  phone: string
  licenseNumber: string
  status: "available" | "on_route" | "delivering" | "offline"
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
  dispatchedAt: string
  dispatchStatus: "pending" | "assigned" | "in_transit" | "delivered" | "cancelled"
  rate: string
  currency: string
  poNumber?: string
  customer: Customer
  carrier: Carrier
  driver?: Driver
  order: Order
  notes?: string
}

// Status color utility
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return "bg-yellow-100 text-yellow-800"
    case 'assigned': return "bg-blue-100 text-blue-800"
    case 'in_transit': return "bg-purple-100 text-purple-800"
    case 'delivered': return "bg-green-100 text-green-800"
    case 'cancelled': return "bg-red-100 text-red-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

export function DispatchesTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch dispatches
  const { data: dispatches = [], isLoading, error } = useQuery({
    queryKey: ['/api/dispatches'],
  })

  // Delete mutation
  const deleteDispatchMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/dispatches/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dispatches'] })
      toast({
        title: "Success",
        description: "Dispatch deleted successfully.",
      })
    },
    onError: (error) => {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: "Failed to delete dispatch",
        variant: "destructive",
      })
    },
  })

  // Handle PDF download using shared utility
  const handleDownloadDispatchPDF = async (dispatch: Dispatch) => {
    try {
      const dispatchHTML = generateDispatchHTML(dispatch)
      
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = dispatchHTML
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      document.body.appendChild(tempDiv)

      const canvas = await html2canvas(tempDiv, {
        width: 794,
        scale: 2,
      })

      document.body.removeChild(tempDiv)

      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const timestamp = format(new Date(), 'yyyy-MM-dd')
      const filename = `dispatch-${dispatch.dispatchNumber}-${timestamp}.pdf`

      pdf.save(filename)

      toast({
        title: "Success",
        description: "Dispatch PDF downloaded successfully.",
      })
    } catch (error) {
      console.error('PDF generation error:', error)
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      })
    }
  }

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
                  <TableHead>Order & PO Number</TableHead>
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
                            setSelectedDispatch(dispatch)
                            setPreviewModalOpen(true)
                          }}
                          data-testid={`button-preview-pdf-${dispatch.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDispatchPDF(dispatch)}
                          data-testid={`button-download-pdf-${dispatch.id}`}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
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
      
      <PDFPreviewModal
        dispatch={selectedDispatch}
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false)
          setSelectedDispatch(null)
        }}
      />
    </Card>
  )
}