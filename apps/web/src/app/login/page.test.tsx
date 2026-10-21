import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "./page";
import { ApiError, authApi } from "../../lib/api";
import { navigateReplace } from "../../lib/navigation";

jest.mock("../../lib/navigation", () => ({
  navigateReplace: jest.fn(),
}));

jest.mock("../../lib/api", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  authApi: {
    login: jest.fn(),
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validates required fields before calling the API", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter your email and password.",
    );
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it("shows safe credential errors", async () => {
    jest
      .mocked(authApi.login)
      .mockRejectedValue(new ApiError("Invalid email or password.", 401));
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "incorrect" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password.",
    );
    expect(navigateReplace).not.toHaveBeenCalled();
  });

  it("sends credentials and navigates to the protected dashboard on success", async () => {
    jest.mocked(authApi.login).mockResolvedValue({
      user: {
        id: "65aa00000000000000000001",
        name: "Example",
        email: "user@example.com",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: " user@example.com " },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Strong-password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(authApi.login).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Strong-password123",
      }),
    );
    expect(navigateReplace).toHaveBeenCalledWith("/dashboard");
  });
});
