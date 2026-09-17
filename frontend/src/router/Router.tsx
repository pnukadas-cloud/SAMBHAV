import React, { createContext, useContext, useEffect, useState } from "react";

type RouterContextType = {
  path: string;
  pathname: string;
  search: string;
  navigate: (to: string) => void;
  params: Record<string, string>;
};

const RouterContext = createContext<RouterContextType>({
  path: "/",
  pathname: "/",
  search: "",
  navigate: () => {},
  params: {},
});

export function getCleanPathname(fullPath: string): string {
  if (!fullPath) return "/";
  const withoutHash = fullPath.split("#")[0];
  const withoutQuery = withoutHash.split("?")[0];
  return withoutQuery || "/";
}

export function getCleanSearch(fullPath: string): string {
  if (!fullPath || !fullPath.includes("?")) return "";
  const queryPart = fullPath.split("?")[1];
  return queryPart ? "?" + queryPart.split("#")[0] : "";
}

/**
 * Validates returnTo destinations to strictly prevent open redirects.
 * Allows only safe internal SAMBHAV paths starting with a single '/' and rejects
 * external schemas, protocol-relative '//', backslashes, and javascript: URIs.
 */
export function validateReturnTo(url: string | null | undefined, fallback: string = "/dashboard"): string {
  if (!url || typeof url !== "string") {
    return fallback;
  }
  const trimmed = url.trim();
  // Must start with single slash and not double slash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }
  // Reject protocol indicators, backslashes, or control characters
  if (
    trimmed.includes("://") ||
    trimmed.toLowerCase().includes("javascript:") ||
    trimmed.toLowerCase().includes("data:") ||
    trimmed.toLowerCase().includes("vbscript:") ||
    trimmed.includes("\\")
  ) {
    return fallback;
  }
  // Must match safe relative path pattern
  const safePathRegex = /^\/[a-zA-Z0-9_\-\/\.\?=&%#~+]*$/;
  if (!safePathRegex.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState<string>(() => {
    return (window.location.pathname || "/") + (window.location.search || "");
  });

  useEffect(() => {
    const handlePopState = () => {
      setPath((window.location.pathname || "/") + (window.location.search || ""));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (to: string) => {
    if (to !== path) {
      window.history.pushState({}, "", to);
      setPath(to);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const pathname = getCleanPathname(path);
  const search = getCleanSearch(path);

  return (
    <RouterContext.Provider value={{ path, pathname, search, navigate, params: {} }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

export function useNavigate() {
  const { navigate } = useContext(RouterContext);
  return navigate;
}

export function useLocation() {
  const { path, pathname, search } = useContext(RouterContext);
  return {
    pathname: pathname || getCleanPathname(path),
    search: search || getCleanSearch(path) || (typeof window !== "undefined" ? window.location.search : ""),
    fullPath: path,
  };
}

// Pattern matcher for routes like /learn/:courseId/:lessonId or /lab/:circuitId
function matchPath(pattern: string, currentPathname: string): { matches: boolean; params: Record<string, string> } {
  const cleanCurrent = getCleanPathname(currentPathname);
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = cleanCurrent.split("/").filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return { matches: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternSegments.length; i++) {
    const pSeg = patternSegments[i];
    const uSeg = pathSegments[i];

    if (pSeg.startsWith(":")) {
      const paramName = pSeg.slice(1);
      params[paramName] = decodeURIComponent(uSeg);
    } else if (pSeg !== uSeg) {
      return { matches: false, params: {} };
    }
  }

  return { matches: true, params };
}

type RouteProps = {
  path: string;
  element: React.ReactNode;
};

export function Route({ path: routePath, element }: RouteProps) {
  const { path, pathname, search, navigate } = useRouter();
  const currentPathname = pathname || getCleanPathname(path);

  if (routePath === currentPathname) {
    return <>{element}</>;
  }

  const { matches, params } = matchPath(routePath, currentPathname);
  if (matches) {
    return (
      <RouterContext.Provider value={{ path, pathname: currentPathname, search, navigate, params }}>
        {element}
      </RouterContext.Provider>
    );
  }

  return null;
}

export function useParams<T extends Record<string, string>>(): T {
  const { params } = useContext(RouterContext);
  return params as T;
}

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
};

export function Link({ to, children, className = "", activeClassName = "", onClick, ...props }: LinkProps) {
  const { pathname, navigate } = useRouter();
  const targetClean = getCleanPathname(to);
  const isActive = pathname === targetClean || (targetClean !== "/" && pathname.startsWith(targetClean));

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={`${className} ${isActive ? activeClassName : ""}`.trim()}
      {...props}
    >
      {children}
    </a>
  );
}
