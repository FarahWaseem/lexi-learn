// Header.jsx
import React from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

const Header = () => {
  return (
    <header className="header">
      <h3></h3>

      <div className="actions">
        <SignedOut>
          {/* لما يكون المستخدم مش مسجّل دخول */}
          <SignInButton />
        </SignedOut>

        <SignedIn>
          {/* زر جاهز من Clerk فيه Logout تلقائي */}
          <UserButton afterSignOutUrl="/login" />
        </SignedIn>
      </div>
    </header>
  );
};

export default Header;
