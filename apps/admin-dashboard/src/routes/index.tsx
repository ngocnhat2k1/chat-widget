import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const token = localStorage.getItem("accessToken");
    throw redirect({ to: token ? "/dashboard" : "/login" });
  },
});
