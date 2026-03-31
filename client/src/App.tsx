import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Fiyatlar from "./pages/Fiyatlar";
import Gizlilik from "./pages/Gizlilik";
import Kosullar from "./pages/Kosullar";
import Giris from "./pages/Giris";
import Kayit from "./pages/Kayit";
import Dashboard from "./pages/Dashboard";
import Panel from "./pages/Panel";
import Stores from "./pages/Stores";
import Chats from "./pages/Chats";
import ChatDetail from "./pages/ChatDetail";
import Analyses from "./pages/Analyses";
import Settings from "./pages/Settings";
import StoreDetail from "./pages/StoreDetail";
import AIChat from "./pages/AIChat";
import Baglantilar from "./pages/Baglantilar";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/fiyatlar"} component={Fiyatlar} />
      <Route path={"/gizlilik"} component={Gizlilik} />
      <Route path={"/kosullar"} component={Kosullar} />
      <Route path={"/login"} component={Giris} />
      <Route path={"/signup"} component={Kayit} />
      <Route path={"/giris"} component={() => <Redirect to="/login" />} />
      <Route path={"/kayit"} component={() => <Redirect to="/signup" />} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/panel"} component={Panel} />
      <Route path={"/stores"} component={Stores} />
      <Route path={"/stores/:storeId"} component={StoreDetail} />
      <Route path={"/chats"} component={Chats} />
      <Route path={"/chats/:chatId"} component={ChatDetail} />
      <Route path={"/analyses"} component={Analyses} />
      <Route path={"/ai-chat"} component={AIChat} />
      <Route path={"/baglantilar"} component={Baglantilar} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
