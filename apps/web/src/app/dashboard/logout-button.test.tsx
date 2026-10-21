import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LogoutButton from "./logout-button";
import { authApi } from "../../lib/api";
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
  authApi: { logout: jest.fn() },
}));

describe("LogoutButton", () => {
  beforeEach(() => jest.clearAllMocks());

  it("clears the server session and navigates to login", async () => {
    jest.mocked(authApi.logout).mockResolvedValue(undefined);
    render(<LogoutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(authApi.logout).toHaveBeenCalled());
    expect(navigateReplace).toHaveBeenCalledWith("/login");
  });
});
