import { SignUp } from "@clerk/nextjs";

import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignUpPage() {
  return (
    <div className="localmap-mesh flex min-h-full flex-col">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <LocalMapLogo />
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      </div>
    </div>
  );
}
