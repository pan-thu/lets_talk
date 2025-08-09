"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { format } from "date-fns";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
} from "lucide-react";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";

export default function AdminPaymentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectionModalState, setRejectionModalState] = useState<{
    isOpen: boolean;
    payment: any | null;
  }>({ isOpen: false, payment: null });
  const [rejectionReason, setRejectionReason] = useState("");

  const {
    data: paymentsData,
    isLoading,
    error,
  } = api.admin.management.listPendingPayments.useQuery({
    page: currentPage,
    limit: 12,
    search: searchTerm || undefined,
  });

  const utils = api.useUtils();

  const approvePaymentMutation =
    api.admin.management.approvePayment.useMutation({
      onSuccess: () => {
        utils.admin.management.listPendingPayments.invalidate();
        alert("Payment approved successfully!");
      },
      onError: (error) => {
        alert(`Error approving payment: ${error.message}`);
      },
    });

  const rejectPaymentMutation = api.admin.management.rejectPayment.useMutation({
    onSuccess: () => {
      utils.admin.management.listPendingPayments.invalidate();
      setRejectionModalState({ isOpen: false, payment: null });
      setRejectionReason("");
      alert("Payment rejected successfully!");
    },
    onError: (error) => {
      alert(`Error rejecting payment: ${error.message}`);
    },
  });

  const handleApprove = async (paymentId: string) => {
    if (window.confirm("Are you sure you want to approve this payment?")) {
      try {
        await approvePaymentMutation.mutateAsync({ paymentId });
      } catch (error) {
        // Error already handled in onError
      }
    }
  };

  const handleRejectConfirm = async () => {
    if (rejectionModalState.payment && rejectionReason.trim()) {
      try {
        await rejectPaymentMutation.mutateAsync({
          paymentId: rejectionModalState.payment.id,
          reason: rejectionReason,
        });
      } catch (error) {
        // Error already handled in onError
      }
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <DollarSign className="mx-auto h-8 w-8 animate-pulse text-blue-600" />
          <p className="mt-2 text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-8 w-8 text-red-600" />
          <p className="mt-2 text-red-600">
            Error loading payments: {error.message}
          </p>
        </div>
      </div>
    );
  }

  const { payments, pagination } = paymentsData || {
    payments: [],
    pagination: { page: 1, pages: 1, total: 0 },
  };

  const stats = {
    total: pagination.total,
    pending: payments.filter((p) => p.status === "PENDING").length,
    approved: payments.filter((p) => p.status === "APPROVED").length,
    rejected: payments.filter((p) => p.status === "REJECTED").length,
  };

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation
        parentPaths={[{ name: "Admin", path: "/admin/dashboard" }]}
        currentPath="Payment Review"
      />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Payment Review
          </h1>
          <p className="text-gray-600">Review and approve manual payments</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Payments
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.approved}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.rejected}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-md border-gray-300 py-2 pr-4 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:w-80"
          />
        </div>
      </div>

      {/* Payments Grid */}
      {payments.length === 0 ? (
        <div className="py-12 text-center">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchTerm ? "No payments found" : "No payments yet"}
          </h3>
          <p className="mt-2 text-gray-600">
            {searchTerm
              ? "Try adjusting your search."
              : "Manual payments will appear here for review."}
          </p>
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">
                    {payment.course?.title || "Unknown Course"}
                  </h3>
                  <p className="mb-2 text-sm text-gray-600">
                    Student: {payment.user?.name || "Unknown"}
                  </p>
                  <div className="mb-3 flex items-center space-x-4 text-sm text-gray-500">
                    <span>${payment.amount}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(payment.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                        payment.status,
                      )}`}
                    >
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment proof */}
              {payment.paymentProofUrl && (
                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Payment Proof:
                  </p>
                  <button
                    onClick={() =>
                      window.open(payment.paymentProofUrl, "_blank")
                    }
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-4 w-4" />
                    View Receipt
                  </button>
                </div>
              )}

              {/* Actions */}
              {payment.status === "PENDING" && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApprove(payment.id)}
                    disabled={approvePaymentMutation.isPending}
                    className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3 w-3" />
                    {approvePaymentMutation.isPending
                      ? "Approving..."
                      : "Approve"}
                  </button>
                  <button
                    onClick={() =>
                      setRejectionModalState({ isOpen: true, payment })
                    }
                    disabled={rejectPaymentMutation.isPending}
                    className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="h-3 w-3" />
                    Reject
                  </button>
                </div>
              )}

              {/* Rejection reason */}
              {payment.status === "REJECTED" && payment.rejectionReason && (
                <div className="mt-4 rounded-md bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-800">
                    Rejection Reason:
                  </p>
                  <p className="text-sm text-red-700">
                    {payment.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(pagination.pages, currentPage + 1))
              }
              disabled={currentPage === pagination.pages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * 12 + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * 12, pagination.total)}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === page
                            ? "z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            : "text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  },
                )}
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(pagination.pages, currentPage + 1))
                  }
                  disabled={currentPage === pagination.pages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {rejectionModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="max-h-screen w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Reject Payment
              </h3>
              <button
                onClick={() =>
                  setRejectionModalState({ isOpen: false, payment: null })
                }
                className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>✕
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Provide a reason for rejecting this payment:
                </p>
                <textarea
                  placeholder="Enter rejection reason..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setRejectionModalState({ isOpen: false, payment: null })
                    }
                    disabled={rejectPaymentMutation.isPending}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectConfirm}
                    disabled={
                      !rejectionReason.trim() || rejectPaymentMutation.isPending
                    }
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {rejectPaymentMutation.isPending
                      ? "Rejecting..."
                      : "Reject Payment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


