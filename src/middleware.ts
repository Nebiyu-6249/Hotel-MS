import { withAuth } from "next-auth/middleware";

// Everything under /admin except the auth screens requires a session.
// Role-level access is enforced per page in requireStaff().
export default withAuth({
  pages: { signIn: "/admin/login" },
});

export const config = {
  matcher: [
    "/admin",
    "/admin/((?!login|forgot-password|reset-password).*)",
  ],
};
