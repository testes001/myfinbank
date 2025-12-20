import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useCreaoAuth } from "@/sdk/core/auth";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const navigate = useNavigate();
	const { isAuthenticated } = useCreaoAuth();

	useEffect(() => {
		if (isAuthenticated) {
			navigate({ to: "/dashboard" });
		} else {
			navigate({ to: "/marketing" });
		}
	}, [isAuthenticated, navigate]);

	return null;
}
