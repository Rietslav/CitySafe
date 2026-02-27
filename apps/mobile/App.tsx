import React from "react";
import { IntroScreen } from "./src/screens/IntroScreen";
import { MapScreen } from "./src/screens/MapScreen";
import { ReportScreen } from "./src/screens/ReportScreen";
import { GuestProfileScreen } from "./src/screens/GuestProfileScreen";
import { UserProfileScreen } from "./src/screens/UserProfileScreen";
import { SignInScreen } from "./src/screens/SignInScreen";
import { SignUpScreen } from "./src/screens/SignUpScreen";
import { loginUser, registerUser, setAuthToken } from "./src/api";

export default function App() {
  const [showIntro, setShowIntro] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: "USER" | "ADMIN";
  } | null>(null);
  const [screen, setScreen] = React.useState<
    "map" | "report" | "profile" | "profileUser" | "signIn" | "signUp"
  >("map");

  React.useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (showIntro) return <IntroScreen />;

  if (screen === "map") {
    return (
      <MapScreen
        onOpenReport={() => setScreen("report")}
        onOpenProfile={() => setScreen("profile")}
      />
    );
  }

  if (screen === "report") {
    return <ReportScreen onBack={() => setScreen("map")} />;
  }

  if (screen === "profile") {
    return (
      <GuestProfileScreen
        onBack={() => setScreen("map")}
        onSignIn={() => setScreen("signIn")}
      />
    );
  }

  if (screen === "profileUser") {
    const name = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
      : "User";
    return (
      <UserProfileScreen
        name={name}
        onBack={() => setScreen("map")}
        onSignOut={() => {
          setCurrentUser(null);
          setAuthToken(null);
          setScreen("profile");
        }}
      />
    );
  }

  if (screen === "signIn") {
    return (
      <SignInScreen
        onBack={() => setScreen("map")}
        onSignUp={() => setScreen("signUp")}
        onSubmit={async ({ email, password }) => {
          const user = await loginUser({ email, password });
          setCurrentUser({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          });
          setAuthToken(user.token);
          setScreen("profileUser");
        }}
      />
    );
  }

  return (
    <SignUpScreen
      onBack={() => setScreen("map")}
      onSignIn={() => setScreen("signIn")}
      onSubmit={async ({ firstName, lastName, email, password }) => {
        const user = await registerUser({ firstName, lastName, email, password });
        setCurrentUser({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        });
        setAuthToken(user.token);
        setScreen("profileUser");
      }}
    />
  );
}
