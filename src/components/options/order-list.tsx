"use client";

import { Trash2, Send, X } from "lucide-react";
import type { ChainOrder } from "@/lib/options-chain";

interface OrderListProps {
  orders: ChainOrder[];
  onDelete: (id: string) => void;
  onCancel: (id: string) => void;
  onSubmit: (id: string) => void;
  onClearAll: () => void;
  onSubmitAll: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  staged: "bg-gray-500/20 text-gray-300",
  submitted: "bg-blue-500/20 text-blue-400",
  filled: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function OrderList({
  orders,
  onDelete,
  onCancel,
  onSubmit,
  onClearAll,
  onSubmitAll,
}: OrderListProps) {
  const stagedCount = orders.filter((o) => o.status === "staged").length;

  return (
    <div className="border-t border-white/10">
      {/* Order entry bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#111118] border-b border-white/5">
        <button
          onClick={onClearAll}
          disabled={orders.length === 0}
          className="px-3 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-30"
        >
          Clear Orders
        </button>

        <span className="text-[10px] text-gray-500 italic">
          Click bid/ask cells in the chain to add orders
        </span>

        <button
          onClick={onSubmitAll}
          disabled={stagedCount === 0}
          className="ml-auto px-4 py-1.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-30"
        >
          Submit {stagedCount > 0 ? `${stagedCount} ` : ""}Orders
        </button>
      </div>

      {/* Orders table */}
      {orders.length > 0 && (
        <div className="max-h-[200px] overflow-y-auto">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-[#0e0e14]">
              <tr className="border-b border-white/5">
                <th className="px-2 py-1 text-left text-gray-600 w-20">Actions</th>
                <th className="px-2 py-1 text-left text-gray-600">Expiry</th>
                <th className="px-2 py-1 text-right text-gray-600">Strike</th>
                <th className="px-2 py-1 text-center text-gray-600">P/C</th>
                <th className="px-2 py-1 text-right text-gray-600">Price</th>
                <th className="px-2 py-1 text-right text-gray-600">Qty</th>
                <th className="px-2 py-1 text-center text-gray-600">Side</th>
                <th className="px-2 py-1 text-center text-gray-600">Status</th>
                <th className="px-2 py-1 text-left text-gray-600">Fill Date</th>
                <th className="px-2 py-1 text-right text-gray-600">Fill Price</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-white/5 hover:bg-white/[0.02]"
                >
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-1">
                      {order.status === "staged" && (
                        <>
                          <button
                            onClick={() => onDelete(order.id)}
                            className="p-0.5 text-gray-600 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={11} />
                          </button>
                          <button
                            onClick={() => onSubmit(order.id)}
                            className="p-0.5 text-gray-600 hover:text-blue-400 transition-colors"
                            title="Submit"
                          >
                            <Send size={11} />
                          </button>
                        </>
                      )}
                      {order.status === "submitted" && (
                        <button
                          onClick={() => onCancel(order.id)}
                          className="p-0.5 text-gray-600 hover:text-red-400 transition-colors"
                          title="Cancel"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1 text-gray-400">{order.expiry}</td>
                  <td className="px-2 py-1 text-right font-mono text-white">
                    {order.strike}
                  </td>
                  <td className={`px-2 py-1 text-center font-medium ${
                    order.optionType === "call" ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {order.optionType.toUpperCase()}
                  </td>
                  <td className="px-2 py-1 text-right font-mono text-gray-300">
                    {order.price.toFixed(2)}
                  </td>
                  <td className="px-2 py-1 text-right font-mono text-gray-300">
                    {order.quantity}
                  </td>
                  <td className={`px-2 py-1 text-center font-medium ${
                    order.side === "buy" ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {order.side}
                  </td>
                  <td className="px-2 py-1 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        STATUS_COLORS[order.status]
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-gray-500">
                    {order.fillDate ?? "—"}
                  </td>
                  <td className="px-2 py-1 text-right font-mono text-gray-400">
                    {order.fillPrice !== null ? order.fillPrice.toFixed(2) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {orders.length === 0 && (
        <div className="px-4 py-6 text-center text-[11px] text-gray-600">
          No orders yet. Click bid/ask cells in the chain above to stage orders.
        </div>
      )}
    </div>
  );
}
