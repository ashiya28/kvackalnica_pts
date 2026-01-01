import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";

import Login from "../src/pages/Login";
import { mockAuthUnauthenticated } from "./mocks/authMock";
import { mockNavigate } from "./mocks/navigateMock";



jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

beforeEach(() => {
  mockNavigate.mockClear();
  global.fetch = jest.fn();
});

test("Login stran se uspešno prikaže", () => {
  mockAuthUnauthenticated();

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  expect(screen.getByText(/prijava/i)).toBeInTheDocument();
});


test("Login forma vsebuje input polja za email in geslo", () => {
  mockAuthUnauthenticated();

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  const emailInput = screen.getByPlaceholderText(/email/i);
  const passwordInput = screen.getByPlaceholderText(/geslo/i);

  expect(emailInput).toBeInTheDocument();
  expect(passwordInput).toBeInTheDocument();
});



test("Uporabnik lahko vpiše email in geslo", async () => {
  mockAuthUnauthenticated();
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  const emailInput = screen.getByPlaceholderText(/email/i);
  const passwordInput = screen.getByPlaceholderText(/geslo/i);

  await user.type(emailInput, "test@example.com");
  await user.type(passwordInput, "mojegeslo");

  expect(emailInput).toHaveValue("test@example.com");
  expect(passwordInput).toHaveValue("mojegeslo");
});


test("Gumb 'Prijavi se' je v formi", () => {
  mockAuthUnauthenticated();

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  const button = screen.getByRole("button", { name: /prijavi se/i });
  expect(button).toBeInTheDocument();
});



// mock useAuth
const mockLogin = jest.fn();
jest.mock("../src/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin
  })
}));


test("Nepravilno geslo sproži alert in ne preusmeri uporabnika", async () => {
  mockLogin.mockResolvedValue({ success: false, message: "Napačno geslo" });

  window.alert = jest.fn(); // mock alert

  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  // izpolnimo obrazec
  await user.type(screen.getByPlaceholderText(/email/i), "test@example.com");
  await user.type(screen.getByPlaceholderText(/geslo/i), "wrongpass");

  // klik
  await user.click(screen.getByRole("button", { name: /prijavi se/i }));

  // pričakovanja
  expect(mockLogin).toHaveBeenCalledWith("test@example.com", "wrongpass");
  expect(window.alert).toHaveBeenCalledWith("Napačno geslo");
  expect(mockNavigate).not.toHaveBeenCalled();
});


test("Pravilni podatki uspešno prijavijo uporabnika in ga preusmerijo na /", async () => {
  mockLogin.mockResolvedValue({ success: true });

  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  await user.type(screen.getByPlaceholderText(/email/i), "ok@example.com");
  await user.type(screen.getByPlaceholderText(/geslo/i), "correctpass");

  await user.click(screen.getByRole("button", { name: /prijavi se/i }));

  expect(mockLogin).toHaveBeenCalledWith("ok@example.com", "correctpass");
  expect(mockNavigate).toHaveBeenCalledWith("/");
});
