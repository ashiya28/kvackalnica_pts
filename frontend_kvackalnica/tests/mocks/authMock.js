import * as AuthContext from "../../src/contexts/AuthContext";

export function mockAuthAuthenticated() {
  jest.spyOn(AuthContext, "useAuth").mockReturnValue({
    isAuthenticated: () => true,
    isLoading: false,
  });
}

export function mockAuthUnauthenticated() {
  jest.spyOn(AuthContext, "useAuth").mockReturnValue({
    isAuthenticated: () => false,
    isLoading: false,
  });
}
