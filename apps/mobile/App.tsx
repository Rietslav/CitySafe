import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IntroScreen } from "./src/screens/IntroScreen";
import { MapScreen } from "./src/screens/MapScreen";
import { ReportScreen } from "./src/screens/ReportScreen";
import { GuestProfileScreen } from "./src/screens/GuestProfileScreen";
import { UserProfileScreen } from "./src/screens/UserProfileScreen";
import { MyReportsScreen } from "./src/screens/MyReportsScreen";
import { SignInScreen } from "./src/screens/SignInScreen";
import { SignUpScreen } from "./src/screens/SignUpScreen";
import { loginUser, registerUser, setAuthToken, type AuthUser } from "./src/api";

type AuthenticatedUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "USER" | "ADMIN" | "MODERATOR";
};

type StoredAuth = {
  token: string;
  user: AuthenticatedUser;
};

const AUTH_STORAGE_KEY = "citysafe.auth" as const;

// MapLibre RN doesn't require a token; avoid calling APIs that may not exist.

export default function App() {
  const [showIntro, setShowIntro] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<AuthenticatedUser | null>(null);
  const [screen, setScreen] = React.useState<
    "map" | "report" | "profile" | "profileUser" | "myReports" | "signIn" | "signUp"
  >("map");
  const [pendingScreen, setPendingScreen] = React.useState<"report" | null>(null);
  const [bootstrapping, setBootstrapping] = React.useState(true);
  const [reportFeedVersion, setReportFeedVersion] = React.useState(0);
  const [myReportsFeedVersion, setMyReportsFeedVersion] = React.useState(0);
  const [reportReturnScreen, setReportReturnScreen] = React.useState<"map" | "myReports">("map");

  React.useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const restoreAuth = async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) {
          return;
        }
        const parsed = JSON.parse(raw) as StoredAuth;
        if (parsed?.token && parsed?.user) {
          setAuthToken(parsed.token);
          if (!cancelled) {
            setCurrentUser(parsed.user);
          }
        } else {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (error) {
        console.warn("restore auth", error);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    };

    restoreAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistAuth = React.useCallback(
    async (user: AuthenticatedUser, token: string) => {
      setCurrentUser(user);
      setAuthToken(token);
      try {
        const payload: StoredAuth = { user, token };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
      } catch (error) {
        console.warn("persist auth", error);
      }
    },
    []
  );

  const handleAuthSuccess = React.useCallback(
    async (auth: AuthUser) => {
      const normalizedUser: AuthenticatedUser = {
        id: auth.id,
        email: auth.email,
        firstName: auth.firstName,
        lastName: auth.lastName,
        role: auth.role
      };
      await persistAuth(normalizedUser, auth.token);
    },
    [persistAuth]
  );

  React.useEffect(() => {
    if (screen === "report" && !currentUser) {
      setPendingScreen("report");
      setScreen("signIn");
    }
  }, [screen, currentUser]);

  const closeReportScreen = React.useCallback(() => {
    setPendingScreen(null);
    const destination = reportReturnScreen;
    setScreen(destination);
    setReportReturnScreen("map");
    return destination;
  }, [reportReturnScreen]);

  if (showIntro || bootstrapping) return <IntroScreen />;

  if (screen === "map") {
    return (
      <MapScreen
        feedVersion={reportFeedVersion}
        canSupportReports={Boolean(currentUser)}
        onOpenReport={() => {
          setReportReturnScreen("map");
          if (!currentUser) {
            setPendingScreen("report");
            setScreen("signIn");
            return;
          }
          setPendingScreen(null);
          setScreen("report");
        }}
        onOpenProfile={() => {
          setPendingScreen(null);
          setScreen(currentUser ? "profileUser" : "profile");
        }}
      />
    );
  }

  if (screen === "report") {
    if (!currentUser) {
      return null;
    }
    return (
      <ReportScreen
        onBack={closeReportScreen}
        onSuccess={() => {
          setReportFeedVersion((value) => value + 1);
          const destination = closeReportScreen();
          if (destination === "myReports") {
            setMyReportsFeedVersion((value) => value + 1);
          }
        }}
      />
    );
  }

  if (screen === "profile") {
    return (
      <GuestProfileScreen
        onBack={() => {
          setPendingScreen(null);
          setScreen("map");
        }}
        onSignIn={() => {
          setPendingScreen(null);
          setScreen("signIn");
        }}
      />
    );
  }

  if (screen === "profileUser") {
    const name = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
      : "Utilizator";
    return (
      <UserProfileScreen
        name={name}
        onBack={() => {
          setPendingScreen(null);
          setScreen("map");
        }}
        onSignOut={async () => {
          setCurrentUser(null);
          setAuthToken(null);
          setPendingScreen(null);
          setReportReturnScreen("map");
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          setScreen("profile");
        }}
        onOpenReports={() => {
          if (!currentUser) {
            return;
          }
          setScreen("myReports");
        }}
      />
    );
  }

  if (screen === "myReports") {
    if (!currentUser) {
      return null;
    }
    return (
      <MyReportsScreen
        currentUserId={currentUser.id}
        feedVersion={myReportsFeedVersion}
        onBack={() => setScreen("profileUser")}
        onAddReport={() => {
          setPendingScreen(null);
          setReportReturnScreen("myReports");
          setScreen("report");
        }}
      />
    );
  }

  if (screen === "signIn") {
    return (
      <SignInScreen
        onBack={() => {
          setPendingScreen(null);
          setScreen("map");
        }}
        onSignUp={() => setScreen("signUp")}
        onSubmit={async ({ email, password }) => {
          const authUser = await loginUser({ email, password });
          await handleAuthSuccess(authUser);
          if (pendingScreen === "report") {
            setPendingScreen(null);
            setScreen("report");
            return;
          }
          setScreen("profileUser");
        }}
      />
    );
  }

  return (
    <SignUpScreen
      onBack={() => {
        setPendingScreen(null);
        setScreen("map");
      }}
      onSignIn={() => setScreen("signIn")}
      onSubmit={async ({ firstName, lastName, email, password }) => {
        const authUser = await registerUser({ firstName, lastName, email, password });
        await handleAuthSuccess(authUser);
        if (pendingScreen === "report") {
          setPendingScreen(null);
          setScreen("report");
          return;
        }
        setScreen("profileUser");
      }}
    />
  );
}
