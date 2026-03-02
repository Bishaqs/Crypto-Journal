"use client";

import { X } from "lucide-react";
import type { SimOrder } from "@/lib/simulator/types";

interface PendingOrdersProps {
  orders: SimOrder[];
  currentPrice: number;
  onCancel: (orderId: string) => void;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

export default function PendingOrders({ orders, currentPrice, onCancel }: PendingOrdersProps) {
  if (orders.length === 0) return null;

  return (
    <div className="px-3 py-2 border-t border-white/5">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider">
          Pending ({orders.length})
        </h3>
        {orders.length > 1 && (
          <button
            onClick={() => orders.forEach((o) => onCancel(o.id))}
            className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
          >
            Cancel All
          </button>
        )}
      </div>
      <div className="space-y-1">
        {orders.map((order) => {
          const distance = currentPrice > 0
            ? ((order.price - currentPrice) / currentPrice * 100).toFixed(2)
            : "0.00";
          const distanceSign = parseFloat(distance) >= 0 ? "+" : "";

          return (
            <div
              key={order.id}
              className="flex items-center gap-2 text-[11px] py-1 px-1.5 rounded bg-white/[0.02]"
            >
              <span className="text-gray-500 uppercase w-8">{order.type}</span>
              <span className={order.side === "buy" ? "text-emerald-400" : "text-red-400"}>
                {order.side.toUpperCase()}
              </span>
              <span className="text-white font-mono text-[10px]">${formatPrice(order.price)}</span>
              <span className="text-gray-500">{order.quantity}</span>
              <span className="text-gray-600 text-[10px] ml-auto">{distanceSign}{distance}%</span>
              <button
                onClick={() => onCancel(order.id)}
                className="p-0.5 rounded hover:bg-white/10 text-gray-600 hover:text-red-400 transition-colors"
                title="Cancel order"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
