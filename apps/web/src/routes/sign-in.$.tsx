import { SignIn } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-in/$')({
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
} 