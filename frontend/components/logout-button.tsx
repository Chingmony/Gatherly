"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  async function onClick() {
    try {
      await logout();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }
  return (
    <Button variant="ghost" onClick={onClick}>
      Sign out
    </Button>
  );
}
