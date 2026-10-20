import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AccountsClient from "./accounts-client";
import { accountsApi, Account } from "../../lib/api";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("../../lib/api", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  accountsApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

const account: Account = {
  id: "65aa00000000000000000001",
  name: "Everyday",
  type: "checking",
  currency: "USD",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("AccountsClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(accountsApi.list).mockResolvedValue([]);
  });

  it("creates an account and reloads the user's account list", async () => {
    jest.mocked(accountsApi.create).mockResolvedValue(account);
    jest
      .mocked(accountsApi.list)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([account]);
    render(<AccountsClient />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Everyday" },
    });
    fireEvent.change(screen.getByLabelText("Currency (ISO 4217)"), {
      target: { value: "usd" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add account" }));

    await waitFor(() =>
      expect(accountsApi.create).toHaveBeenCalledWith({
        name: "Everyday",
        type: "checking",
        currency: "USD",
      }),
    );
    expect(await screen.findByText("Account created.")).toBeInTheDocument();
  });

  it("edits an existing account using only editable fields", async () => {
    jest.mocked(accountsApi.list).mockResolvedValue([account]);
    jest.mocked(accountsApi.update).mockResolvedValue({
      ...account,
      name: "Main account",
    });
    render(<AccountsClient />);

    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Main account" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(accountsApi.update).toHaveBeenCalledWith(account.id, {
        name: "Main account",
        type: "checking",
        currency: "USD",
      }),
    );
  });
});
