import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Index from "../src/pages/Index";
import { mockAuthUnauthenticated } from "./mocks/authMock";
import { mockNavigate } from "./mocks/navigateMock";


jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

beforeEach(() => {
  mockNavigate.mockClear();
  mockAuthUnauthenticated();
});


test("Index stran se uspešno prikaže", () => {
  render(
    <MemoryRouter>
      <Index />
    </MemoryRouter>
  );

  expect(screen.getByText(/kvačkalnica/i)).toBeInTheDocument();
});


test("Index stran vsebuje tri gumbe za navigacijo", () => {
  render(
    <MemoryRouter>
      <Index />
    </MemoryRouter>
  );

  expect(screen.getByRole("button", { name: /dodaj nov projekt/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /nadaljuj s projektom/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /končani projekti/i })).toBeInTheDocument();
});


test("Gumbi vodijo na pravilne poti (href vrednosti linkov)", () => {
  render(
    <MemoryRouter>
      <Index />
    </MemoryRouter>
  );

  const addNewLink = screen.getByRole("link", { name: /dodaj nov projekt/i });
  const inProgressLink = screen.getByRole("link", { name: /nadaljuj s projektom/i });
  const finishedLink = screen.getByRole("link", { name: /končani projekti/i });

  expect(addNewLink).toHaveAttribute("href", "/AddNewProject");
  expect(inProgressLink).toHaveAttribute("href", "/ProjectsInProgress");
  expect(finishedLink).toHaveAttribute("href", "/FinishedProjects");
});




