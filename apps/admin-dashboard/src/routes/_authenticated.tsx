import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "../components/dashboard-layout";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: DashboardLayout,
});
