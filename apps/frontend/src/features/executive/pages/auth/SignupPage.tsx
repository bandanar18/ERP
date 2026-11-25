import { AuthSplitLayout } from "@/features/executive/layouts/AuthSplitLayout";
import { SignupForm } from "@/features/executive/components/features/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthSplitLayout>
      <SignupForm />
    </AuthSplitLayout>
  );
}
