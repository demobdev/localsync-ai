import { SignIn } from "@clerk/nextjs";

import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignInPage() {
  return (
    <div className="localmap-mesh flex min-h-full flex-col">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <LocalMapLogo />
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      </div>
    </div>
  );
}
