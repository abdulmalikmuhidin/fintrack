import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TransactionsClient from "./transactions-client";
import {
  Account,
  accountsApi,
  Transaction,
  transactionsApi,
} from "../../lib/api";

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
  accountsApi: { list: jest.fn() },
  transactionsApi: { list: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
}));

const account: Account = {
  id: "65aa00000000000000000001",
  name: "Everyday",
  type: "checking",
  currency: "USD",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const emptyPage = {
  items: [] as Transaction[],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

describe("TransactionsClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(accountsApi.list).mockResolvedValue([account]);
    jest.mocked(transactionsApi.list).mockResolvedValue(emptyPage);
  });

  it("creates a transaction with integer minor units and selected account", async () => {
    jest.mocked(transactionsApi.create).mockResolvedValue({
      id: "65aa00000000000000000002",
      accountId: account.id,
      type: "expense",
      amountMinor: 1250,
      currency: "USD",
      category: "Food",
      description: "",
      date: "2026-10-19T00:00:00.000Z",
      createdAt: "2026-10-19T00:00:00.000Z",
      updatedAt: "2026-10-19T00:00:00.000Z",
    });
    render(<TransactionsClient />);

    await screen.findByRole("option", { name: "Everyday (USD)" });
    fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "expense" },
    });
    fireEvent.change(screen.getByLabelText("Amount (USD)"), {
      target: { value: "12.50" },
    });
    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "Food" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add transaction" }));

    await waitFor(() =>
      expect(transactionsApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: account.id,
          type: "expense",
          amountMinor: 1250,
          category: "Food",
        }),
      ),
    );
  });

  it("reports pagination empty-state context when no transaction matches", async () => {
    render(<TransactionsClient />);
    expect(
      await screen.findByText(
        "No transactions match these filters. Add a transaction or adjust the filters.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 0 of 0")).toBeInTheDocument();
  });
});
