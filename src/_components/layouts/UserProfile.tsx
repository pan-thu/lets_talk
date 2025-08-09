"use client";

import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { api } from "~/trpc/react";
import {
  AlertCircle,
  Loader2,
  Upload,
  X,
  LogOut,
  User,
  Settings,
} from "lucide-react";

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const utils = api.useUtils();
  const { data: profileData, isLoading: isLoadingProfile } =
    api.user.getProfile.useQuery();

  const updateProfileMutation = api.user.updateProfile.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(null), 3000);
      utils.user.getProfile.invalidate();
    },
  });

  const changePasswordMutation = api.user.changePassword.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(null), 3000);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPasswordChange(false);
    },
  });

  useEffect(() => {
    if (profileData) {
      setName(profileData.name ?? "");
      setEmail(profileData.email ?? "");
    }
  }, [profileData]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError(
        "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
      );
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError("File too large. Maximum size is 5MB.");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload/profile-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setSuccessMessage(result.message);
      setTimeout(() => setSuccessMessage(null), 3000);
      handleRemoveFile(); // Clear selection after successful upload
      utils.user.getProfile.invalidate();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name });
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) return;
    if (newPassword.length < 8) return;
    if (!currentPassword.trim()) return;
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleLogout = () => {
    void signOut({ callbackUrl: "/auth/signin" });
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {isLoadingProfile ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/5 p-4 backdrop-blur-sm"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: 0,
          }}
        >
          <div className="rounded-lg bg-white p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      ) : (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/5 p-4 backdrop-blur-sm"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: 0,
          }}
        >
          <div
            ref={modalRef}
            className="mx-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">User Profile</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mx-4 mt-4 rounded bg-green-100 p-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            {/* Profile Display */}
            {!showProfileEdit && !showPasswordChange ? (
              <div className="p-4">
                <div className="mb-6 flex flex-col items-center">
                  <Image
                    src={profileData?.image || "/placeholder-avatar.png"}
                    alt="Profile Picture"
                    width={80}
                    height={80}
                    className="mb-3 h-20 w-20 rounded-full object-cover"
                  />
                  <h3 className="text-lg font-semibold">
                    {profileData?.name || "User"}
                  </h3>
                  <p className="text-sm text-gray-600">{profileData?.email}</p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => setShowProfileEdit(true)}
                    className="flex w-full items-center gap-3 rounded-md p-3 text-left hover:bg-gray-50"
                  >
                    <User className="h-5 w-5 text-gray-500" />
                    <span>Edit Profile</span>
                  </button>

                  {profileData?.hasPassword && (
                    <button
                      onClick={() => setShowPasswordChange(true)}
                      className="flex w-full items-center gap-3 rounded-md p-3 text-left hover:bg-gray-50"
                    >
                      <Settings className="h-5 w-5 text-gray-500" />
                      <span>Change Password</span>
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-md p-3 text-left text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : showPasswordChange ? (
              /* Password Change Form */
              <div className="p-4">
                <div className="mb-4 flex items-center gap-2">
                  <button
                    onClick={() => setShowPasswordChange(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <h3 className="text-lg font-semibold">Change Password</h3>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Current Password
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmNewPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirmNewPassword"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  {newPassword !== confirmNewPassword && confirmNewPassword && (
                    <p className="text-sm text-red-600">
                      <AlertCircle className="mr-1 inline h-4 w-4" />
                      Passwords do not match.
                    </p>
                  )}

                  {changePasswordMutation.error && (
                    <p className="text-sm text-red-600">
                      <AlertCircle className="mr-1 inline h-4 w-4" />
                      {changePasswordMutation.error.message}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(false)}
                      className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? (
                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                      ) : (
                        "Change Password"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Profile Edit Form */
              <div className="p-4">
                <div className="mb-4 flex items-center gap-2">
                  <button
                    onClick={() => setShowProfileEdit(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <h3 className="text-lg font-semibold">Edit Profile</h3>
                </div>

                {/* Profile Picture Upload */}
                <div className="mb-6 flex flex-col items-center">
                  <Image
                    src={
                      previewUrl ||
                      profileData?.image ||
                      "/placeholder-avatar.png"
                    }
                    alt="Profile Picture"
                    width={80}
                    height={80}
                    className="mb-3 h-20 w-20 rounded-full object-cover"
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-2 inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4" />
                    Choose Image
                  </button>

                  {selectedFile && (
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm text-gray-600">
                        {selectedFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleFileUpload}
                        disabled={isUploading}
                        className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Upload
                      </button>
                    </div>
                  )}

                  {uploadError && (
                    <p className="mt-2 flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {uploadError}
                    </p>
                  )}
                </div>

                {/* Name Form */}
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
                    />
                  </div>

                  {updateProfileMutation.error && (
                    <p className="text-sm text-red-600">
                      <AlertCircle className="mr-1 inline h-4 w-4" />
                      {updateProfileMutation.error.message}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowProfileEdit(false)}
                      className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  // Use portal to render outside of sidebar context
  return createPortal(modalContent, document.body);
}
