import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Order {
  id: string
  date: string
  customer: string
  destination: string
  amount: string
  carrier: string
  payment: "Pending" | "Paid" | "Processing"
  status: "Shipped" | "Processing" | "Delivered"
}

export function OrdersTable() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  // TODO: Remove mock data - replace with real orders from API
  const orders: Order[] = [
    {
      id: "#10254",
      date: "2025-09-06",
      customer: "John Doe",
      destination: "New York, USA",
      amount: "$250.00",
      carrier: "FedEx",
      payment: "Pending",
      status: "Shipped",
    },
    {
      id: "#10254",
      date: "2025-09-06",
      customer: "John Doe", 
      destination: "New York, USA",
      amount: "$250.00",
      carrier: "FedEx",
      payment: "Paid",
      status: "Processing",
    },
    {
      id: "#10254",
      date: "2025-09-06",
      customer: "John Doe",
      destination: "New York, USA",
      amount: "$250.00",
      carrier: "FedEx",
      payment: "Pending",
      status: "Shipped",
    },
    {
      id: "#10254", 
      date: "2025-09-06",
      customer: "John Doe",
      destination: "New York, USA",
      amount: "$250.00",
      carrier: "FedEx",
      payment: "Paid",
      status: "Processing",
    },
    {
      id: "#10254",
      date: "2025-09-06",
      customer: "John Doe",
      destination: "New York, USA",
      amount: "$250.00",
      carrier: "FedEx",
      payment: "Pending",
      status: "Shipped",
    },
    {
      id: "#10254",
      date: "2025-09-06", 
      customer: "John Doe",
      destination: "New York, USA",
      amount: "$250.00",
      carrier: "FedEx",
      payment: "Paid",
      status: "Processing",
    },
    {
      id: "#10254",
      date: "2025-09-06",
      customer: "John Doe",
      destination: "New York, USA",
      amount: "$250.00",
      carrier: "FedEx",
      payment: "Pending",
      status: "Shipped",
    },
  ]

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId])
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId))
    }
    console.log(`Order ${orderId} ${checked ? 'selected' : 'deselected'}`)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map(order => order.id))
    } else {
      setSelectedOrders([])
    }
    console.log(`${checked ? 'All orders selected' : 'All orders deselected'}`)
  }

  const getPaymentBadgeVariant = (payment: string) => {
    switch (payment) {
      case "Paid":
        return "secondary"
      case "Pending":
        return "outline"
      case "Processing":
        return "default"
      default:
        return "outline"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Shipped":
        return "default"
      case "Processing":
        return "outline"
      case "Delivered":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="bg-card rounded-lg border border-card-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onCheckedChange={handleSelectAll}
                data-testid="checkbox-select-all"
              />
            </TableHead>
            <TableHead data-testid="header-order-id">Order ID</TableHead>
            <TableHead data-testid="header-date">Date</TableHead>
            <TableHead data-testid="header-customer">Customer</TableHead>
            <TableHead data-testid="header-destination">Destination</TableHead>
            <TableHead data-testid="header-amount">Amount</TableHead>
            <TableHead data-testid="header-carrier">Carrier</TableHead>
            <TableHead data-testid="header-payment">Payment</TableHead>
            <TableHead data-testid="header-status">Status</TableHead>
            <TableHead data-testid="header-actions">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, index) => (
            <TableRow
              key={`${order.id}-${index}`}
              className={selectedOrders.includes(`${order.id}-${index}`) ? "bg-muted/50" : ""}
              data-testid={`row-order-${index}`}
            >
              <TableCell>
                <Checkbox
                  checked={selectedOrders.includes(`${order.id}-${index}`)}
                  onCheckedChange={(checked) => handleSelectOrder(`${order.id}-${index}`, checked as boolean)}
                  data-testid={`checkbox-order-${index}`}
                />
              </TableCell>
              <TableCell className="font-medium" data-testid={`cell-id-${index}`}>
                {order.id}
              </TableCell>
              <TableCell data-testid={`cell-date-${index}`}>{order.date}</TableCell>
              <TableCell data-testid={`cell-customer-${index}`}>{order.customer}</TableCell>
              <TableCell data-testid={`cell-destination-${index}`}>{order.destination}</TableCell>
              <TableCell data-testid={`cell-amount-${index}`}>{order.amount}</TableCell>
              <TableCell data-testid={`cell-carrier-${index}`}>{order.carrier}</TableCell>
              <TableCell data-testid={`cell-payment-${index}`}>
                <Badge variant={getPaymentBadgeVariant(order.payment)}>
                  {order.payment}
                </Badge>
              </TableCell>
              <TableCell data-testid={`cell-status-${index}`}>
                <Badge variant={getStatusBadgeVariant(order.status)}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell data-testid={`cell-actions-${index}`}>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => console.log(`Edit order ${order.id}`)}
                    data-testid={`button-edit-${index}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => console.log(`Delete order ${order.id}`)}
                    data-testid={`button-delete-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}