import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RegisterPage from "./page";
import { ApiError, authApi } from "../../lib/api";

jest.mock("../../lib/api", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  authApi: {
    register: jest.fn(),
  },
}));

describe("RegisterPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects mismatched password confirmation without sending a request", async () => {
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Example User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Strong-password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "Different-password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The password confirmation does not match.",
    );
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it("creates the account without sending password confirmation", async () => {
    jest.mocked(authApi.register).mockResolvedValue({
      user: {
        id: "65aa00000000000000000001",
        name: "Example User",
        email: "user@example.com",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: " Example User " },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Strong-password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "Strong-password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(authApi.register).toHaveBeenCalledWith({
        name: "Example User",
        email: "user@example.com",
        password: "Strong-password123",
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your account has been created.",
    );
    expect(screen.getByRole("link", { name: "Continue to login" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("displays server validation failures", async () => {
    jest
      .mocked(authApi.register)
      .mockRejectedValue(new ApiError("Email is already registered.", 409));
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Example User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Strong-password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "Strong-password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email is already registered.",
    );
  });
});
