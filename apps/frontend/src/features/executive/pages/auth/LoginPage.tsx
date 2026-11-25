import { AuthSplitLayout } from "@/features/executive/layouts/AuthSplitLayout";
import { LoginForm } from "@/features/executive/components/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthSplitLayout>
      <LoginForm />
    </AuthSplitLayout>
  );
}