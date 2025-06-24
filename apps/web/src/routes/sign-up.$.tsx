import { SignUp } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-up/$')({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
} 