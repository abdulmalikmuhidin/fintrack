import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DashboardClient from "./dashboard-client";
import { ApiError, DashboardSummary, dashboardApi } from "../../lib/api";

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, refresh: jest.fn() }),
}));

jest.mock("../../lib/api", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  dashboardApi: { getSummary: jest.fn() },
}));

jest.mock("recharts", () => {
  const React = require("react");
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children);
  return {
    Bar: () => null,
    BarChart: Wrapper,
    CartesianGrid: () => null,
    Cell: () => null,
    Legend: () => null,
    Pie: Wrapper,
    PieChart: Wrapper,
    ResponsiveContainer: Wrapper,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null,
  };
});

const baseSummary: DashboardSummary = {
  period: { startDate: "2026-10-01", endDate: "2026-10-31" },
  currencies: [
    {
      currency: "USD",
      balanceMinor: 10_500,
      incomeMinor: 2_000,
      expenseMinor: 1_250,
      netCashFlowMinor: 750,
    },
  ],
  monthly: [
    {
      month: "2026-10",
      currency: "USD",
      incomeMinor: 2_000,
      expenseMinor: 1_250,
    },
  ],
  expenseCategories: [{ category: "Food", currency: "USD", amountMinor: 1_250 }],
  recentTransactions: [],
};

describe("DashboardClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads real summary values and displays no fabricated recent activity", async () => {
    jest.mocked(dashboardApi.getSummary).mockResolvedValue(baseSummary);
    render(
      <DashboardClient
        initialStartDate="2026-10-01"
        initialEndDate="2026-10-31"
      />,
    );

    expect(await screen.findByText("$105.00")).toBeInTheDocument();
    expect(screen.getByText("$20.00")).toBeInTheDocument();
    expect(screen.getByText("$12.50")).toBeInTheDocument();
    expect(screen.getByText("$7.50")).toBeInTheDocument();
    expect(
      screen.getByText("No transactions recorded yet."),
    ).toBeInTheDocument();
    expect(dashboardApi.getSummary).toHaveBeenCalledWith({
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });
  });

  it("renders an empty state when a user has no account currencies", async () => {
    jest.mocked(dashboardApi.getSummary).mockResolvedValue({
      ...baseSummary,
      currencies: [],
      monthly: [],
      expenseCategories: [],
    });
    render(
      <DashboardClient
        initialStartDate="2026-10-01"
        initialEndDate="2026-10-31"
      />,
    );

    expect(await screen.findByText("Start with an account")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add an account" })).toHaveAttribute(
      "href",
      "/accounts",
    );
  });

  it("redirects to login when the session has expired", async () => {
    jest
      .mocked(dashboardApi.getSummary)
      .mockRejectedValue(new ApiError("Session expired.", 401));
    render(
      <DashboardClient
        initialStartDate="2026-10-01"
        initialEndDate="2026-10-31"
      />,
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
  });

  it("shows a recoverable API failure", async () => {
    jest
      .mocked(dashboardApi.getSummary)
      .mockRejectedValue(new ApiError("Service unavailable.", 503));
    render(
      <DashboardClient
        initialStartDate="2026-10-01"
        initialEndDate="2026-10-31"
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Service unavailable.",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
