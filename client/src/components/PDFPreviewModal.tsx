import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Download, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
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

interface PDFPreviewModalProps {
  dispatch: Dispatch | null
  isOpen: boolean
  onClose: () => void
}


export function PDFPreviewModal({ dispatch, isOpen, onClose }: PDFPreviewModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleDownloadPDF = async () => {
    if (!dispatch) return

    setIsGenerating(true)
    try {
      // Create dispatch HTML content
      const dispatchHTML = generateDispatchHTML(dispatch)
      
      // Create a temporary div to render the dispatch
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = dispatchHTML
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      document.body.appendChild(tempDiv)

      // Capture the HTML as canvas using html2canvas
      const canvas = await html2canvas(tempDiv, {
        width: 794, // A4 width in pixels at 96 DPI
        scale: 2, // Higher quality - let height size dynamically to content
      })

      // Remove the temporary div
      document.body.removeChild(tempDiv)

      // Create PDF using jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add new pages if content exceeds one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Generate filename
      const timestamp = format(new Date(), 'yyyy-MM-dd')
      const filename = `dispatch-${dispatch.dispatchNumber}-${timestamp}.pdf`

      // Download the PDF
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
    } finally {
      setIsGenerating(false)
    }
  }

  if (!dispatch) return null

  const htmlContent = generateDispatchHTML(dispatch)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Dispatch PDF Preview - {dispatch.dispatchNumber}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                data-testid="button-download-pdf-modal"
              >
                <Download className="w-4 h-4 mr-1" />
                {isGenerating ? "Generating..." : "Download PDF"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                data-testid="button-close-preview"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto border rounded-lg bg-white">
          <div 
            className="p-4"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            data-testid="pdf-preview-content"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}