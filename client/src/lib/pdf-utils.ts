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

export const generateDispatchHTML = (dispatch: Dispatch) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 794px; margin: 0 auto; padding: 40px; background: white;">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #8B5CF6; padding-bottom: 20px;">
        <h1 style="color: #8B5CF6; font-size: 28px; margin: 0;">DISPATCH DOCUMENT</h1>
        <p style="color: #666; margin: 10px 0;">Professional Logistics Dispatch Services</p>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h3 style="color: #333; border-bottom: 2px solid #8B5CF6; padding-bottom: 5px;">Dispatch Information:</h3>
          <p style="margin: 10px 0; line-height: 1.6;">
            <strong>Dispatch #:</strong> ${dispatch.dispatchNumber}<br>
            <strong>Order #:</strong> ${dispatch.order.orderNumber}<br>
            <strong>Status:</strong> ${dispatch.dispatchStatus.replaceAll('_', ' ').toUpperCase()}<br>
            <strong>Dispatched At:</strong> ${format(new Date(dispatch.dispatchedAt), 'PPP p')}<br>
            ${dispatch.poNumber ? `<strong>PO Number:</strong> ${dispatch.poNumber}<br>` : ''}
          </p>
        </div>
        <div style="text-align: right;">
          <h3 style="color: #333; border-bottom: 2px solid #8B5CF6; padding-bottom: 5px;">Financial Details:</h3>
          <p style="margin: 10px 0; line-height: 1.6;">
            <strong>Rate:</strong> <span style="color: #8B5CF6; font-size: 18px;">${dispatch.currency} ${dispatch.rate}</span><br>
            <strong>Currency:</strong> ${dispatch.currency}<br>
            <strong>Generated:</strong> ${format(new Date(), 'PPP p')}
          </p>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; border-bottom: 2px solid #8B5CF6; padding-bottom: 5px; margin-bottom: 15px;">Customer Information:</h3>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #8B5CF6;">
          <p style="margin: 0; line-height: 1.6;">
            <strong style="color: #8B5CF6;">${dispatch.customer.name}</strong><br>
            Email: ${dispatch.customer.email}<br>
            Phone: ${dispatch.customer.phone}<br>
            Address: ${dispatch.customer.address}, ${dispatch.customer.city}, ${dispatch.customer.country}
          </p>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; border-bottom: 2px solid #8B5CF6; padding-bottom: 5px; margin-bottom: 15px;">Carrier Information:</h3>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #8B5CF6;">
          <p style="margin: 0; line-height: 1.6;">
            <strong style="color: #8B5CF6;">${dispatch.carrier.name}</strong><br>
            Carrier Code: ${dispatch.carrier.code}<br>
            Service Areas: ${dispatch.carrier.serviceAreas.join(', ')}
          </p>
        </div>
      </div>

      ${dispatch.driver ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; border-bottom: 2px solid #8B5CF6; padding-bottom: 5px; margin-bottom: 15px;">Driver Information:</h3>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #8B5CF6;">
            <p style="margin: 0; line-height: 1.6;">
              <strong style="color: #8B5CF6;">${dispatch.driver.name}</strong><br>
              Phone: ${dispatch.driver.phone}<br>
              License #: ${dispatch.driver.licenseNumber}<br>
              Status: ${dispatch.driver.status.replaceAll('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>
      ` : ''}

      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; border-bottom: 2px solid #8B5CF6; padding-bottom: 5px; margin-bottom: 15px;">Pickup & Delivery:</h3>
        <div style="display: flex; gap: 20px;">
          <div style="flex: 1; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
            <h4 style="color: #10b981; margin: 0 0 10px 0;">PICKUP LOCATION</h4>
            <p style="margin: 0; line-height: 1.6;">
              ${dispatch.order.pickupAddress}
            </p>
          </div>
          <div style="flex: 1; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h4 style="color: #f59e0b; margin: 0 0 10px 0;">DELIVERY LOCATION</h4>
            <p style="margin: 0; line-height: 1.6;">
              ${dispatch.order.deliveryAddress}
            </p>
          </div>
        </div>
      </div>

      ${dispatch.order.notes || dispatch.notes ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; border-bottom: 2px solid #8B5CF6; padding-bottom: 5px; margin-bottom: 15px;">Additional Notes:</h3>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280;">
            ${dispatch.order.notes ? `<p style="margin: 0 0 10px 0; line-height: 1.6;"><strong>Order Notes:</strong> ${dispatch.order.notes}</p>` : ''}
            ${dispatch.notes ? `<p style="margin: 0; line-height: 1.6;"><strong>Dispatch Notes:</strong> ${dispatch.notes}</p>` : ''}
          </div>
        </div>
      ` : ''}

      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #666; font-size: 12px;">
        <p>This dispatch document was generated electronically and is valid without signature.</p>
        <p>For questions or concerns, please contact our logistics team.</p>
      </div>
    </div>
  `
}