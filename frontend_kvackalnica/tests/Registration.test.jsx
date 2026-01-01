import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";

import Registration from "../src/pages/Registration";
import { mockNavigate } from "./mocks/navigateMock";


jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

beforeEach(() => {
  mockNavigate.mockClear();
  global.fetch = jest.fn();
});


test("Stran za registracijo se prikaže", () => {
  render(
    <MemoryRouter>
      <Registration />
    </MemoryRouter>
  );
  expect(screen.getByText(/registracija/i)).toBeInTheDocument();
});


test("Uporabnik lahko vpiše podatke", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <Registration />
    </MemoryRouter>
  );

  await user.type(screen.getByPlaceholderText(/uporabniško ime/i), "ana");
  await user.type(screen.getByPlaceholderText(/email/i), "ana@example.com");
  await user.type(screen.getByPlaceholderText(/geslo/i), "123456");

  expect(screen.getByPlaceholderText(/uporabniško ime/i)).toHaveValue("ana");
  expect(screen.getByPlaceholderText(/email/i)).toHaveValue("ana@example.com");
  expect(screen.getByPlaceholderText(/geslo/i)).toHaveValue("123456");
});


test("Uspešna registracija preusmeri uporabnika na /Login", async () => {
  const user = userEvent.setup();

  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({})
  });

  render(
    <MemoryRouter>
      <Registration />
    </MemoryRouter>
  );

  await user.type(screen.getByPlaceholderText(/uporabniško ime/i), "ana");
  await user.type(screen.getByPlaceholderText(/email/i), "ana@example.com");
  await user.type(screen.getByPlaceholderText(/geslo/i), "123456");

  await user.click(screen.getByRole("button", { name: /registriraj se/i }));

  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith("/Login");
});


test("Neuspešna registracija prikaže napako in NE preusmeri uporabnika", async () => {
  const user = userEvent.setup();

  global.fetch.mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({ error: "Email je že zaseden" })
  });

  const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

  render(
    <MemoryRouter>
      <Registration />
    </MemoryRouter>
  );

  await user.type(screen.getByPlaceholderText(/uporabniško ime/i), "ana");
  await user.type(screen.getByPlaceholderText(/email/i), "ana@example.com");
  await user.type(screen.getByPlaceholderText(/geslo/i), "123456");

  await user.click(screen.getByRole("button", { name: /registriraj se/i }));

  expect(global.fetch).toHaveBeenCalledTimes(1);

  expect(alertMock).toHaveBeenCalledWith("Email je že zaseden");

  expect(mockNavigate).not.toHaveBeenCalled();

  alertMock.mockRestore();
});
