//singup.jsx
import { SignUp } from "@clerk/clerk-react"

export default function Signup() {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <SignUp path="/signup" routing="path" signInUrl="/login" />
    </div>
  )
}
