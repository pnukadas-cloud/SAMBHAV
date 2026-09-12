import React, { createContext, useContext, useEffect, useState } from "react";

type RouterContextType = {
  path: string;
  navigate: (to: string) => void;
  params: Record<string, string>;
};

const RouterContext = createContext<RouterContextType>({
  path: "/",
  navigate: () => {},
  params: {},
});

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState<string>(() => {
    return window.location.pathname || "/";
  });

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || "/");
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

  return (
    <RouterContext.Provider value={{ path, navigate, params: {} }}>
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
  const { path } = useContext(RouterContext);
  return { pathname: path };
}

// Pattern matcher for routes like /learn/:courseId/:lessonId or /lab/:circuitId
function matchPath(pattern: string, currentPath: string): { matches: boolean; params: Record<string, string> } {
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = currentPath.split("/").filter(Boolean);

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
  const { path: currentPath, navigate } = useRouter();

  if (routePath === currentPath) {
    return <>{element}</>;
  }

  const { matches, params } = matchPath(routePath, currentPath);
  if (matches) {
    return (
      <RouterContext.Provider value={{ path: currentPath, navigate, params }}>
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
  const { path, navigate } = useRouter();
  const isActive = path === to || (to !== "/" && path.startsWith(to));

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
