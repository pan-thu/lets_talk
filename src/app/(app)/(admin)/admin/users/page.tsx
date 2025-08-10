"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { format } from "date-fns";
import {
  UserPlus,
  Edit3,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  Shield,
  GraduationCap,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Role } from "@prisma/client";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { PaginationControls } from "~/_components/shared/PaginationControls";
import { AdminModalWrapper } from "~/_components/ui/AdminModalWrapper";

export default function AdminUsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateTeacherModalOpen, setIsCreateTeacherModalOpen] =
    useState(false);
  const [editUserModalState, setEditUserModalState] = useState<{
    isOpen: boolean;
    user: any | null;
  }>({ isOpen: false, user: null });
  const [deleteUserModalState, setDeleteUserModalState] = useState<{
    isOpen: boolean;
    user: any | null;
  }>({ isOpen: false, user: null });

  // Form states
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    role: Role;
  }>({
    name: "",
    email: "",
    role: Role.STUDENT,
  });

  // Queries and mutations
  const {
    data: usersData,
    isLoading,
    error,
  } = api.admin.user.listUsers.useQuery({
    page: currentPage,
    limit: 20,
    search: searchTerm || undefined,
  });

  const utils = api.useUtils();

  const createTeacherMutation = api.admin.user.createTeacher.useMutation({
    onSuccess: () => {
      utils.admin.user.listUsers.invalidate();
      setIsCreateTeacherModalOpen(false);
      setTeacherForm({ name: "", email: "", password: "" });
      alert("Teacher created successfully!");
    },
    onError: (error) => {
      alert(`Error creating teacher: ${error.message}`);
    },
  });

  const updateUserMutation = api.admin.user.updateUser.useMutation({
    onSuccess: () => {
      utils.admin.user.listUsers.invalidate();
      setEditUserModalState({ isOpen: false, user: null });
      alert("User updated successfully!");
    },
    onError: (error) => {
      alert(`Error updating user: ${error.message}`);
    },
  });

  const deleteUserMutation = api.admin.user.deleteUser.useMutation({
    onSuccess: () => {
      utils.admin.user.listUsers.invalidate();
      setDeleteUserModalState({ isOpen: false, user: null });
      alert("User deleted successfully!");
    },
    onError: (error) => {
      alert(`Error deleting user: ${error.message}`);
    },
  });

  // Handlers
  const handleCreateTeacher = () => {
    if (teacherForm.name && teacherForm.email && teacherForm.password) {
      createTeacherMutation.mutate(teacherForm);
    }
  };

  const handleEditUser = () => {
    if (editUserModalState.user && editForm.name && editForm.email) {
      updateUserMutation.mutate({
        userId: editUserModalState.user.id,
        ...editForm,
      });
    }
  };

  const handleDeleteUser = () => {
    if (deleteUserModalState.user) {
      deleteUserMutation.mutate({ userId: deleteUserModalState.user.id });
    }
  };

  const openEditModal = (user: any) => {
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role,
    });
    setEditUserModalState({ isOpen: true, user });
  };

  const getRoleBadgeClass = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return "bg-red-100 text-red-800";
      case Role.TEACHER:
        return "bg-blue-100 text-blue-800";
      case Role.STUDENT:
        return "bg-green-100 text-green-800";
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return <Shield className="h-4 w-4" />;
      case Role.TEACHER:
        return <GraduationCap className="h-4 w-4" />;
      case Role.STUDENT:
        return <User className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Users className="mx-auto h-8 w-8 animate-pulse text-blue-600" />
          <p className="mt-2 text-gray-600">Loading users...</p>
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
            Error loading users: {error.message}
          </p>
        </div>
      </div>
    );
  }

  const { users, pagination } = usersData || {
    users: [],
    pagination: { page: 1, pages: 1, total: 0 },
  };

  const stats = {
    total: pagination.total,
    students: users.filter((u) => u.role === Role.STUDENT).length,
    teachers: users.filter((u) => u.role === Role.TEACHER).length,
    admins: users.filter((u) => u.role === Role.ADMIN).length,
  };

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation
        parentPaths={[{ name: "Admin", path: "/admin/dashboard" }]}
        currentPath="User Management"
      />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            User Management
          </h1>
          <p className="text-gray-600">Manage all users on the platform</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsCreateTeacherModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4" />
            Create Teacher
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.students}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Teachers</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.teachers}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
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
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-md border-gray-300 py-2 pr-4 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:w-80"
          />
        </div>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchTerm ? "No users found" : "No users yet"}
          </h3>
          <p className="mt-2 text-gray-600">
            {searchTerm
              ? "Try adjusting your search."
              : "Get started by creating a teacher account."}
          </p>
        </div>
      ) : (
        <div className="mb-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeClass(
                        user.role,
                      )}`}
                    >
                      {getRoleIcon(user.role)}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setDeleteUserModalState({ isOpen: true, user })
                        }
                        className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
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
                {(currentPage - 1) * 20 + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * 20, pagination.total)}
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

      {/* Create Teacher Modal */}
      <AdminModalWrapper
        isOpen={isCreateTeacherModalOpen}
        onClose={() => setIsCreateTeacherModalOpen(false)}
        title="Create Teacher Account"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={teacherForm.name}
            onChange={(e) =>
              setTeacherForm({ ...teacherForm, name: e.target.value })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={teacherForm.email}
            onChange={(e) =>
              setTeacherForm({ ...teacherForm, email: e.target.value })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={teacherForm.password}
            onChange={(e) =>
              setTeacherForm({ ...teacherForm, password: e.target.value })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateTeacherModalOpen(false)}
              disabled={createTeacherMutation.isPending}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateTeacher}
              disabled={
                !teacherForm.name ||
                !teacherForm.email ||
                !teacherForm.password ||
                createTeacherMutation.isPending
              }
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createTeacherMutation.isPending
                ? "Creating..."
                : "Create Teacher"}
            </button>
          </div>
        </div>
      </AdminModalWrapper>

      {/* Edit User Modal */}
      <AdminModalWrapper
        isOpen={editUserModalState.isOpen}
        onClose={() => setEditUserModalState({ isOpen: false, user: null })}
        title="Edit User"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={editForm.name}
            onChange={(e) =>
              setEditForm({ ...editForm, name: e.target.value })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={editForm.email}
            onChange={(e) =>
              setEditForm({ ...editForm, email: e.target.value })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <select
            value={editForm.role}
            onChange={(e) =>
              setEditForm({ ...editForm, role: e.target.value as Role })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value={Role.STUDENT}>Student</option>
            <option value={Role.TEACHER}>Teacher</option>
            <option value={Role.ADMIN}>Admin</option>
          </select>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() =>
                setEditUserModalState({ isOpen: false, user: null })
              }
              disabled={updateUserMutation.isPending}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEditUser}
              disabled={
                !editForm.name ||
                !editForm.email ||
                updateUserMutation.isPending
              }
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateUserMutation.isPending
                ? "Updating..."
                : "Update User"}
            </button>
          </div>
        </div>
      </AdminModalWrapper>

      {/* Delete User Modal */}
      <AdminModalWrapper
        isOpen={deleteUserModalState.isOpen}
        onClose={() => setDeleteUserModalState({ isOpen: false, user: null })}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete{" "}
            {deleteUserModalState.user?.name ?? "this user"}? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() =>
                setDeleteUserModalState({ isOpen: false, user: null })
              }
              disabled={deleteUserMutation.isPending}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteUserMutation.isPending
                ? "Deleting..."
                : "Delete User"}
            </button>
          </div>
        </div>
      </AdminModalWrapper>
    </div>
  );
}


