"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function AdminTestPage() {
  // Payment approval state
  const [paymentId, setPaymentId] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  // Teacher creation state
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [teacherResult, setTeacherResult] = useState<string>("");

  // Course assignment state
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [assignmentResult, setAssignmentResult] = useState<string>("");

  const approvePaymentMutation =
    api.admin.management.approvePayment.useMutation({
      onSuccess: (data: { success: boolean; message: string }) => {
        setMessage(`✅ ${data.message}`);
      },
      onError: (error: { message: string }) => {
        setMessage(`❌ ${error.message}`);
      },
    });

  const createTeacherMutation = api.admin.management.createTeacher.useMutation({
    onSuccess: (data) => {
      setTeacherResult(`✅ Success: ${JSON.stringify(data, null, 2)}`);
      // Clear form
      setTeacherName("");
      setTeacherEmail("");
      setTeacherPassword("");
    },
    onError: (error) => {
      setTeacherResult(`❌ Error: ${error.message}`);
    },
  });

  // Queries for course assignment
  const { data: teachers } = api.admin.management.getAllTeachers.useQuery();
  const { data: courses } = api.admin.management.getAllCourses.useQuery();
  const utils = api.useUtils();

  const assignCourseToTeacherMutation =
    api.admin.management.assignCourseToTeacher.useMutation({
      onSuccess: (data) => {
        setAssignmentResult(`✅ Success: ${data.message}`);
        // Clear form
        setSelectedCourseId("");
        setSelectedTeacherId("");
        // Refetch data to show updated assignments
        void utils.admin.management.getAllCourses.invalidate();
        void utils.admin.management.getAllTeachers.invalidate();
      },
      onError: (error) => {
        setAssignmentResult(`❌ Error: ${error.message}`);
      },
    });

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const id = parseInt(paymentId, 10);
    if (isNaN(id) || id <= 0) {
      setMessage("❌ Please enter a valid payment ID");
      return;
    }
    approvePaymentMutation.mutate({ paymentId: id });
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherResult("");
    createTeacherMutation.mutate({
      name: teacherName,
      email: teacherEmail,
      password: teacherPassword,
    });
  };

  const handleAssignCourse = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignmentResult("");

    if (!selectedCourseId || !selectedTeacherId) {
      setAssignmentResult("❌ Please select both a course and a teacher");
      return;
    }

    assignCourseToTeacherMutation.mutate({
      courseId: parseInt(selectedCourseId, 10),
      teacherId: selectedTeacherId,
    });
  };

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Admin Test Panel</h1>
      <div className="mb-6 rounded-lg border bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Testing Only:</strong> This page is for testing admin
          functionality. In production, this would be in a secure admin panel
          and accessible only to Admin roles.
        </p>
      </div>

      <div className="space-y-8">
        {/* Payment Approval Section */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Approve Payment</h2>
          <form onSubmit={handleApprove} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Payment ID
              </label>
              <input
                type="number"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="Enter payment ID to approve"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={approvePaymentMutation.isPending}
              className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:opacity-50"
            >
              {approvePaymentMutation.isPending
                ? "Approving..."
                : "Approve Payment"}
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-md bg-gray-50 p-4">
              <p className="text-sm">{message}</p>
            </div>
          )}
        </div>

        {/* Teacher Creation Section */}
        <div className="border-t pt-6">
          <h2 className="mb-4 text-xl font-semibold">Create Teacher Account</h2>
          <form onSubmit={handleCreateTeacher} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Teacher Name
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Enter teacher's full name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="teacher@school.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={createTeacherMutation.isPending}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
            >
              {createTeacherMutation.isPending
                ? "Creating Teacher..."
                : "Create Teacher Account"}
            </button>
          </form>

          {teacherResult && (
            <div className="mt-4 rounded-md bg-gray-50 p-4">
              <pre className="text-sm whitespace-pre-wrap">{teacherResult}</pre>
            </div>
          )}
        </div>

        {/* Course Assignment Section */}
        <div className="border-t pt-6">
          <h2 className="mb-4 text-xl font-semibold">
            Assign Course to Teacher
          </h2>
          <form onSubmit={handleAssignCourse} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              >
                <option value="">Choose a course...</option>
                {courses?.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}{" "}
                    {course.teacher
                      ? `(Currently: ${course.teacher.name})`
                      : "(Unassigned)"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Teacher
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              >
                <option value="">Choose a teacher...</option>
                {teachers?.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.email}) -{" "}
                    {teacher.taughtCourses.length} course(s)
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={assignCourseToTeacherMutation.isPending}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
            >
              {assignCourseToTeacherMutation.isPending
                ? "Assigning Course..."
                : "Assign Course to Teacher"}
            </button>
          </form>

          {assignmentResult && (
            <div className="mt-4 rounded-md bg-gray-50 p-4">
              <p className="text-sm">{assignmentResult}</p>
            </div>
          )}

          {/* Course and Teacher Overview */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 font-medium text-gray-900">
                Current Course Assignments
              </h3>
              <div className="space-y-2">
                {courses?.map((course) => (
                  <div key={course.id} className="rounded border p-3 text-sm">
                    <div className="font-medium">{course.title}</div>
                    <div className="text-gray-600">
                      {course.teacher ? (
                        <span className="text-green-600">
                          Assigned to: {course.teacher.name}
                        </span>
                      ) : (
                        <span className="text-orange-600">Unassigned</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-medium text-gray-900">
                Teacher Workload
              </h3>
              <div className="space-y-2">
                {teachers?.map((teacher) => (
                  <div key={teacher.id} className="rounded border p-3 text-sm">
                    <div className="font-medium">{teacher.name}</div>
                    <div className="text-gray-600">
                      {teacher.taughtCourses.length} course(s) assigned
                    </div>
                    {teacher.taughtCourses.length > 0 && (
                      <div className="mt-1 text-xs text-blue-600">
                        {teacher.taughtCourses
                          .map((course) => course.title)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


