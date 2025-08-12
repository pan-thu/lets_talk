"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { format } from "date-fns";
import {
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  UserCog,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
} from "lucide-react";
import { TicketStatus, TicketPriority } from "@prisma/client";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { PaginationControls } from "~/_components/features/shared/PaginationControls";
import { AdminModalWrapper } from "~/_components/ui/AdminModalWrapper";


export default function AdminSupportPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(
    undefined,
  );
  const [detailModalState, setDetailModalState] = useState<{
    isOpen: boolean;
    ticket: any | null;
  }>({ isOpen: false, ticket: null });
  const [responseModalState, setResponseModalState] = useState<{
    isOpen: boolean;
    ticket: any | null;
  }>({ isOpen: false, ticket: null });
  const [responseContent, setResponseContent] = useState("");

  // Queries and mutations
  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    error: ticketsError,
  } = api.admin.support.listSupportTickets.useQuery({
    page: currentPage,
    limit: 10,
    search: searchTerm || undefined,
    status: statusFilter,
  });

  const { data: admins } = api.admin.support.getAllAdmins.useQuery();

  const utils = api.useUtils();

  const updateTicketStatusMutation =
    api.admin.support.updateTicketStatus.useMutation({
      onSuccess: () => {
        utils.admin.support.listSupportTickets.invalidate();
        alert("Ticket status updated successfully!");
      },
      onError: (error) => {
        alert(`Error updating ticket: ${error.message}`);
      },
    });

  const addTicketResponseMutation =
    api.admin.support.addTicketResponse.useMutation({
      onSuccess: () => {
        utils.admin.support.listSupportTickets.invalidate();
        setResponseModalState({ isOpen: false, ticket: null });
        setResponseContent("");
        alert("Response added successfully!");
      },
      onError: (error) => {
        alert(`Error adding response: ${error.message}`);
      },
    });

  const assignTicketMutation = api.admin.support.assignTicket.useMutation({
    onSuccess: () => {
      utils.admin.support.listSupportTickets.invalidate();
      alert("Ticket assigned successfully!");
    },
    onError: (error) => {
      alert(`Error assigning ticket: ${error.message}`);
    },
  });

  // Handlers
  const handleStatusUpdate = (ticketId: string, status: TicketStatus) => {
    updateTicketStatusMutation.mutate({ ticketId, status });
  };

  const handleAssignTicket = (ticketId: string, adminId: string) => {
    assignTicketMutation.mutate({ ticketId, adminId });
  };

  const handleAddResponse = () => {
    if (responseModalState.ticket && responseContent.trim()) {
      addTicketResponseMutation.mutate({
        ticketId: responseModalState.ticket.id,
        content: responseContent,
      });
    }
  };

  const openResponseModal = (ticket: any) => {
    setResponseModalState({ isOpen: true, ticket });
    setResponseContent("");
  };

  // Helper functions
  const getStatusBadgeClass = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return "bg-yellow-100 text-yellow-800";
      case TicketStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800";
      case TicketStatus.RESOLVED:
        return "bg-green-100 text-green-800";
      case TicketStatus.CLOSED:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return <AlertCircle className="h-4 w-4" />;
      case TicketStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4" />;
      case TicketStatus.RESOLVED:
        return <CheckCircle className="h-4 w-4" />;
      case TicketStatus.CLOSED:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getPriorityBadgeClass = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.LOW:
        return "bg-gray-100 text-gray-800";
      case TicketPriority.MEDIUM:
        return "bg-yellow-100 text-yellow-800";
      case TicketPriority.HIGH:
        return "bg-red-100 text-red-800";
    }
  };

  const getPriorityIcon = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.LOW:
        return <ArrowDownCircle className="h-4 w-4" />;
      case TicketPriority.MEDIUM:
        return <MinusCircle className="h-4 w-4" />;
      case TicketPriority.HIGH:
        return <ArrowUpCircle className="h-4 w-4" />;
    }
  };

  if (ticketsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <MessageSquare className="mx-auto h-8 w-8 animate-pulse text-blue-600" />
          <p className="mt-2 text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  if (ticketsError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-8 w-8 text-red-600" />
          <p className="mt-2 text-red-600">
            Error loading tickets: {ticketsError.message}
          </p>
        </div>
      </div>
    );
  }

  const { tickets, pagination } = ticketsData || {
    tickets: [],
    pagination: { page: 1, pages: 1, total: 0 },
  };

  const stats = {
    total: pagination.total,
    open: tickets.filter((t) => t.status === TicketStatus.OPEN).length,
    inProgress: tickets.filter((t) => t.status === TicketStatus.IN_PROGRESS)
      .length,
    resolved: tickets.filter((t) => t.status === TicketStatus.RESOLVED).length,
    closed: tickets.filter((t) => t.status === TicketStatus.CLOSED).length,
  };

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation
        parentPaths={[{ name: "Admin", path: "/admin/dashboard" }]}
        currentPath="Support Tickets"
      />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Support Tickets
          </h1>
          <p className="text-gray-600">Manage customer support requests</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Open</p>
              <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.inProgress}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.resolved}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-md border-gray-300 py-2 pr-4 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:w-80"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter || ""}
            onChange={(e) => {
              setStatusFilter(
                e.target.value ? (e.target.value as TicketStatus) : undefined,
              );
              setCurrentPage(1);
            }}
            className="rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value={TicketStatus.OPEN}>Open</option>
            <option value={TicketStatus.IN_PROGRESS}>In Progress</option>
            <option value={TicketStatus.RESOLVED}>Resolved</option>
            <option value={TicketStatus.CLOSED}>Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      {tickets.length === 0 ? (
        <div className="py-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchTerm || statusFilter ? "No tickets found" : "No tickets yet"}
          </h3>
          <p className="mt-2 text-gray-600">
            {searchTerm || statusFilter
              ? "Try adjusting your search or filters."
              : "Support tickets will appear here when submitted."}
          </p>
        </div>
      ) : (
        <div className="mb-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.subject}
                      </div>
                      <div className="text-sm text-gray-500">
                        by {ticket.user?.name || "Unknown"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                        ticket.status,
                      )}`}
                    >
                      {getStatusIcon(ticket.status)}
                      {ticket.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityBadgeClass(
                        ticket.priority,
                      )}`}
                    >
                      {getPriorityIcon(ticket.priority)}
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    <div className="flex items-center gap-2">
                      <select
                        value={ticket.assignedToId || ""}
                        onChange={(e) =>
                          handleAssignTicket(ticket.id, e.target.value)
                        }
                        className="rounded-md border-gray-300 text-xs focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Unassigned</option>
                        {admins?.map((admin) => (
                          <option key={admin.id} value={admin.id}>
                            {admin.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          setDetailModalState({ isOpen: true, ticket })
                        }
                        className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openResponseModal(ticket)}
                        className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700"
                      >
                        Reply
                      </button>
                      <select
                        value={ticket.status}
                        onChange={(e) =>
                          handleStatusUpdate(
                            ticket.id,
                            e.target.value as TicketStatus,
                          )
                        }
                        className="rounded-md border-gray-300 text-xs focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value={TicketStatus.OPEN}>Open</option>
                        <option value={TicketStatus.IN_PROGRESS}>
                          In Progress
                        </option>
                        <option value={TicketStatus.RESOLVED}>Resolved</option>
                        <option value={TicketStatus.CLOSED}>Closed</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div>
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * 10 + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * 10, pagination.total)}
              </span>{" "}
              of <span className="font-medium">{pagination.total}</span>{" "}
              results
            </p>
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={pagination.pages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Ticket Detail Modal */}
      <AdminModalWrapper
        isOpen={detailModalState.isOpen}
        onClose={() => setDetailModalState({ isOpen: false, ticket: null })}
        title="Ticket Details"
      >
        {detailModalState.ticket && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {detailModalState.ticket.subject}
              </h3>
              <p className="text-sm text-gray-600">
                Submitted by {detailModalState.ticket.user?.name || "Unknown"}{" "}
                on{" "}
                {format(
                  new Date(detailModalState.ticket.createdAt),
                  "MMM d, yyyy 'at' h:mm a",
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                  detailModalState.ticket.status,
                )}`}
              >
                {getStatusIcon(detailModalState.ticket.status)}
                {detailModalState.ticket.status.replace("_", " ")}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityBadgeClass(
                  detailModalState.ticket.priority,
                )}`}
              >
                {getPriorityIcon(detailModalState.ticket.priority)}
                {detailModalState.ticket.priority}
              </span>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-900">
                Description:
              </h4>
              <p className="text-sm whitespace-pre-wrap text-gray-700">
                {detailModalState.ticket.description}
              </p>
            </div>
            {detailModalState.ticket.assignedTo && (
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Assigned to:
                </h4>
                <p className="text-sm text-gray-600">
                  {detailModalState.ticket.assignedTo.name}
                </p>
              </div>
            )}
            {detailModalState.ticket.responses &&
              detailModalState.ticket.responses.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-900">
                    Responses:
                  </h4>
                  <div className="max-h-64 space-y-3 overflow-y-auto">
                    {detailModalState.ticket.responses.map(
                      (response, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-blue-500 pl-4"
                        >
                          <p className="text-sm text-gray-700">
                            {response.content}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {response.author?.name || "Unknown"} -{" "}
                            {format(
                              new Date(response.createdAt),
                              "MMM d, yyyy 'at' h:mm a",
                            )}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
      </AdminModalWrapper>

      {/* Response Modal */}
      <AdminModalWrapper
        isOpen={responseModalState.isOpen}
        onClose={() => setResponseModalState({ isOpen: false, ticket: null })}
        title="Add Response"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Responding to: {responseModalState.ticket?.subject}
          </p>
          <textarea
            placeholder="Enter your response..."
            value={responseContent}
            onChange={(e) => setResponseContent(e.target.value)}
            rows={6}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                setResponseModalState({ isOpen: false, ticket: null })
              }
              disabled={addTicketResponseMutation.isPending}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddResponse}
              disabled={
                !responseContent.trim() || addTicketResponseMutation.isPending
              }
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {addTicketResponseMutation.isPending
                ? "Sending..."
                : "Send Response"}
            </button>
          </div>
        </div>
      </AdminModalWrapper>
    </div>
  );
}


