"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType;
  count?: number;
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Compose Button */}
      <div className="p-4">
        <button className="w-full bg-blue-600 text-white rounded-full px-6 py-3 flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors">
          <ComposeIcon className="w-5 h-5" />
          <span>Compose</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <NavItem
          href="/inbox"
          icon={InboxIcon}
          label="Inbox"
          count={5}
          active={pathname === "/inbox"}
        />
        <NavItem
          href="/sent"
          icon={SendIcon}
          label="Sent"
          active={pathname === "/sent"}
        />
        <NavItem
          href="/drafts"
          icon={DraftIcon}
          label="Drafts"
          count={2}
          active={pathname === "/drafts"}
        />
        <NavItem
          href="/trash"
          icon={TrashIcon}
          label="Trash"
          active={pathname === "/trash"}
        />
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
          <div className="flex-1">
            <div className="text-sm font-medium">User Name</div>
            <div className="text-xs text-gray-500">user@example.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, count, active }: NavItem & { active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-3 py-2 rounded-lg mb-1 ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-sm text-gray-600">{count}</span>
      )}
    </Link>
  );
}

// Icon Components
function ComposeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function InboxIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );
}

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  );
}

function DraftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}