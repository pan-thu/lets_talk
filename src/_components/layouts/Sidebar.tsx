"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Bell,
  Calendar,
  BookOpen,
  Info,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCog,
  DollarSign,
  Megaphone,
  MessageCircle,
} from "lucide-react";
import { api } from "~/trpc/react";
import { UserProfile } from "~/_components/layouts/UserProfile";
import { Role } from "@prisma/client";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const pathname = usePathname();

  const { data: profileData } = api.user.getProfile.useQuery();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleUserProfileClick = () => {
    setShowUserProfile(true);
  };

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const iconSize = isCollapsed ? 20 : 20;
  const userRole = profileData?.role;

  // DYNAMIC HREFS
  let announcementsHref = "/announcements";
  let blogHref = "/blog";
  let calendarHref = "/calendar";
  
  if (userRole === Role.TEACHER) {
    announcementsHref = "/teacher/announcements";
    blogHref = "/teacher/blog";
    calendarHref = "/teacher/calendar";
  } else if (userRole === Role.ADMIN) {
    // For admins, links point to their management pages or specific calendar view
    announcementsHref = "/admin/announcements";
    blogHref = "/admin/blog";
    calendarHref = "/admin/calendar";
  }

  return (
    <>
      <aside
        className={`sidebar flex h-full flex-col transition-all duration-300 ease-out md:h-screen ${
          isCollapsed ? "w-16" : "w-64 md:w-60"
        }`}
      >
        {/* Logo Area */}
        <div className="hidden h-16 items-center gap-2 px-4 md:flex">
          <Image
            src="/logo.png"
            alt="Let's Talk Logo"
            width={32}
            height={32}
            className="transition-transform duration-300 ease-out"
          />
          {!isCollapsed && (
            <span className="origin-left overflow-hidden text-lg font-semibold whitespace-nowrap transition-all duration-300 ease-out">
              Let's Talk
            </span>
          )}
        </div>

        <div className="sidebar-border hidden border-b md:block"></div>

        {/* Main Navigation */}
        <nav className="flex-grow space-y-1 p-4">
          {/* Dashboard - Role-specific */}
          {userRole === Role.STUDENT && (
            <Link
              href="/dashboard"
              className={`sidebar-item flex items-center gap-3 rounded ${
                pathname === "/dashboard" ? "active" : ""
              } ${
                isCollapsed ? "justify-center py-3" : "px-3 py-2"
              } text-sm transition-all duration-200 ease-out hover:translate-x-1`}
              title="Dashboard"
            >
              <LayoutDashboard size={iconSize} />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
          )}

          {userRole === Role.TEACHER && (
            <Link
              href="/teacher/dashboard"
              className={`sidebar-item flex items-center gap-3 rounded ${
                pathname === "/teacher/dashboard" ? "active" : ""
              } ${
                isCollapsed ? "justify-center py-3" : "px-3 py-2"
              } text-sm transition-all duration-200 ease-out hover:translate-x-1`}
              title="Teacher Dashboard"
            >
              <LayoutDashboard size={iconSize} />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
          )}

          {userRole === Role.ADMIN && (
            <Link
              href="/admin/dashboard"
              className={`sidebar-item flex items-center gap-3 rounded ${
                pathname === "/admin/dashboard" ? "active" : ""
              } ${
                isCollapsed ? "justify-center py-3" : "px-3 py-2"
              } text-sm transition-all duration-200 ease-out hover:translate-x-1`}
              title="Admin Dashboard"
            >
              <LayoutDashboard size={iconSize} />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
          )}

          {/* Courses - Role-specific */}
          {userRole === Role.STUDENT && (
            <>
              <Link
                href="/courses"
                className={`sidebar-item flex items-center gap-3 rounded ${
                  pathname.startsWith("/courses") ? "active" : ""
                } ${
                  isCollapsed ? "justify-center py-3" : "px-3 py-2"
                } text-sm font-medium transition-all duration-200 ease-out hover:translate-x-1`}
                title="Course"
              >
                <GraduationCap size={iconSize} />
                {!isCollapsed && <span>Course</span>}
              </Link>

            </>
          )}

          {userRole === Role.TEACHER && (
            <Link
              href="/teacher/courses"
              className={`sidebar-item flex items-center gap-3 rounded ${
                pathname.startsWith("/teacher/courses") ? "active" : ""
              } ${
                isCollapsed ? "justify-center py-3" : "px-3 py-2"
              } text-sm font-medium transition-all duration-200 ease-out hover:translate-x-1`}
              title="My Courses"
            >
              <GraduationCap size={iconSize} />
              {!isCollapsed && <span>My Courses</span>}
            </Link>
          )}

          {userRole === Role.ADMIN && (
            <>
              <Link
                href="/admin/courses"
                className={`sidebar-item flex items-center gap-3 rounded ${
                  pathname.startsWith("/admin/courses") ? "active" : ""
                } ${
                  isCollapsed ? "justify-center py-3" : "px-3 py-2"
                } text-sm font-medium transition-all duration-200 ease-out hover:translate-x-1`}
                title="Course Management"
              >
                <GraduationCap size={iconSize} />
                {!isCollapsed && <span>Course Management</span>}
              </Link>
              <Link
                href="/admin/payments"
                className={`sidebar-item flex items-center gap-3 rounded ${
                  pathname.startsWith("/admin/payments") ? "active" : ""
                } ${
                  isCollapsed ? "justify-center py-3" : "px-3 py-2"
                } text-sm font-medium transition-all duration-200 ease-out hover:translate-x-1`}
                title="Payment Review"
              >
                <DollarSign size={iconSize} />
                {!isCollapsed && <span>Payment Review</span>}
              </Link>
              <Link
                href="/admin/users"
                className={`sidebar-item flex items-center gap-3 rounded ${
                  pathname.startsWith("/admin/users") ? "active" : ""
                } ${
                  isCollapsed ? "justify-center py-3" : "px-3 py-2"
                } text-sm font-medium transition-all duration-200 ease-out hover:translate-x-1`}
                title="User Management"
              >
                <UserCog size={iconSize} />
                {!isCollapsed && <span>User Management</span>}
              </Link>
              <Link
                href="/admin/announcements"
                className={`sidebar-item flex items-center gap-3 rounded ${
                  pathname.startsWith("/admin/announcements") ? "active" : ""
                } ${
                  isCollapsed ? "justify-center py-3" : "px-3 py-2"
                } text-sm font-medium transition-all duration-200 ease-out hover:translate-x-1`}
                title="Content - Announcements"
              >
                <Megaphone size={iconSize} />
                {!isCollapsed && <span>Announcements</span>}
              </Link>
              <Link
                href="/admin/blog"
                className={`sidebar-item flex items-center gap-3 rounded ${
                  pathname.startsWith("/admin/blog") ? "active" : ""
                } ${
                  isCollapsed ? "justify-center py-3" : "px-3 py-2"
                } text-sm font-medium transition-all duration-200 ease-out hover:translate-x-1`}
                title="Content - Blog"
              >
                <FileText size={iconSize} />
                {!isCollapsed && <span>Blog Posts</span>}
              </Link>


            </>
          )}

          {/* Global Links - hide redundant ones for admin users */}
          {userRole !== Role.ADMIN && (
            <Link
              href={announcementsHref}
              className={`sidebar-item flex items-center gap-3 rounded ${
                pathname.startsWith(announcementsHref) ? "active" : ""
              } ${
                isCollapsed ? "justify-center py-3" : "px-3 py-2"
              } text-sm transition-all duration-200 ease-out hover:translate-x-1`}
              title="Announcement"
            >
              <Bell size={iconSize} />
              {!isCollapsed && <span>Announcement</span>}
            </Link>
          )}
          <Link
            href={calendarHref}
            className={`sidebar-item flex items-center gap-3 rounded ${
              pathname.startsWith(calendarHref) ? "active" : ""
            } ${
              isCollapsed ? "justify-center py-3" : "px-3 py-2"
            } text-sm transition-all duration-200 ease-out hover:translate-x-1`}
            title="Calendar"
          >
            <Calendar size={iconSize} />
            {!isCollapsed && <span>Calendar</span>}
          </Link>
          {userRole !== Role.ADMIN && (
            <Link
              href={blogHref}
              className={`sidebar-item flex items-center gap-3 rounded ${
                pathname.startsWith(blogHref) ? "active" : ""
              } ${
                isCollapsed ? "justify-center py-3" : "px-3 py-2"
              } text-sm font-medium transition-all duration-200 ease-out hover:translate-x-1`}
              title="Blog"
            >
              <BookOpen size={iconSize} />
              {!isCollapsed && <span>Blog</span>}
            </Link>
          )}
        </nav>

        {/* Footer Navigation */}
        <div className="sidebar-border border-t"></div>
        <div className="p-4">
          <div
            onClick={handleUserProfileClick}
            className={`mb-4 flex cursor-pointer items-center rounded transition-all duration-300 ease-out hover:bg-gray-100 ${
              isCollapsed ? "justify-center py-3" : "gap-3 px-3 py-2"
            }`}
          >
            {profileData?.image ? (
              <Image
                src={profileData.image}
                alt="Profile Picture"
                width={isCollapsed ? 36 : 32}
                height={isCollapsed ? 36 : 32}
                className={`rounded-full object-cover ${
                  isCollapsed ? "h-9 w-9" : "h-8 w-8"
                }`}
              />
            ) : (
              <span
                className={`flex items-center justify-center rounded-full bg-gray-600 font-medium text-white ${
                  isCollapsed ? "h-9 w-9 text-sm" : "h-8 w-8 text-sm"
                }`}
              >
                {getUserInitials(profileData?.name)}
              </span>
            )}
            {!isCollapsed && <span>{profileData?.name || "User"}</span>}
          </div>

          <button
            onClick={toggleSidebar}
            className={`sidebar-item hover:bg-opacity-20 flex w-full items-center gap-3 rounded text-sm transition-all duration-200 ease-out hover:bg-white active:scale-95 ${
              isCollapsed ? "justify-center py-3" : "px-3 py-2"
            }`}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronRight size={iconSize} />
            ) : (
              <>
                <ChevronLeft size={iconSize} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <UserProfile
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />
    </>
  );
}
