import { useState } from "react";
import {
  Calculator,
  TrendingUp,
  Target,
  DollarSign,
  BarChart3,
  Lightbulb,
  
} from "lucide-react";
import AnalysisForm from "./components/AnalysisForm.tsx";
import ResultsDisplay from "./components/ResultsDisplay.tsx";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";
import { ThemeProvider } from "./contexts/ThemeContext";

interface AnalysisParams {
  startingAge: number;
  currentAge: number;
  startingSalary: number;
  needsRatio: number;
  wantsRatio: number;
  investmentRatio: number;
  emergencyFundRatio: number;
  expectedReturn: number;
  inflationRate: number;
  salaryGrowthRate: number;
  // Investment time horizon - how many years to invest
  investmentTimeHorizon: number;
  // Legacy fields for backward compatibility
  expenseRatio: number;
  // New parameter for realistic expense modeling
  useRealisticExpenses?: boolean;
  // Investment strategy breakdown
  investmentBreakdown?: {
    mutualFundsRatio: number;
    stocksRatio: number;
    debtRatio: number;
    fixedDepositsRatio: number;
    digitalGoldRatio: number;
    othersRatio: number;
  };
  // Custom expected returns for each investment type
  customReturns?: {
    mutualFundsReturn: number;
    stocksReturn: number;
    debtReturn: number;
    fixedDepositsReturn: number;
    digitalGoldReturn: number;
    othersReturn: number;
  };
}

interface AnalysisResults {
  breakEvenAge: number | null;
  portfolioValue: number;
  annualReturn: number;
  annualExpenses: number;
  totalInvested: number;
  yearsToBreakEven: number | null;
  monthlySipNeeded: number;
  requiredMonthlySIP: number | null;
  // New self-sustainability metrics
  selfSustainabilityAge: number | null;
  yearsToSelfSustainability: number | null;
  selfSustainabilityPortfolioValue: number | null;
  monthlyReturnAtSustainability: number | null;
  breakEvenPortfolioValue: number | null;
  financialIndependenceRatio: number;
  chartData: {
    ages: number[];
    portfolioValues: number[];
    annualReturns: number[];
    monthlyReturns: number[];
    annualExpenses: number[];
    salaries: number[];
    investments: number[];
    monthlyInvestments: number[];
    cumulativeInvestments: number[];
  };
  scenarios: {
    balanced: ScenarioResult;
    fire: ScenarioResult;
    aggressive: ScenarioResult;
    conservative: ScenarioResult;
    student: ScenarioResult;
    minimalist: ScenarioResult;
    lifestyle: ScenarioResult;
  };
  warnings: {
    breakEvenBeyondLifeExpectancy: boolean;
    breakEvenBeyondRetirement: boolean;
    noBreakEvenFound: boolean;
    selfSustainabilityBeyondLifeExpectancy: boolean;
    selfSustainabilityBeyondRetirement: boolean;
    noSelfSustainabilityFound: boolean;
    calculatedToAge: number;
  };
  // Include allocation breakdown if available
  allocationBreakdown?: {
    needsRatio: number;
    wantsRatio: number;
    investmentRatio: number;
    emergencyFundRatio: number;
    monthlyNeeds: number;
    monthlyWants: number;
    monthlyInvestments: number;
    monthlyEmergencyFund: number;
  };
  metadata: {
    analysisDate: string;
    parameters: AnalysisParams;
  };
}

interface ScenarioResult {
  name: string;
  description: string;
  expenseRatio: number;
  investmentRatio: number;
  expectedReturn: number;
  results: Omit<AnalysisResults, "scenarios" | "metadata">;
}

function App() {
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate analysis parameters
  const validateParams = (params: AnalysisParams): string | null => {
    // Check if basic required fields are present and valid
    if (
      !params.currentAge ||
      params.currentAge < 18 ||
      params.currentAge > 100
    ) {
      return "Please enter a valid current age (18-100)";
    }

    if (!params.startingSalary || params.startingSalary <= 0) {
      return "Please enter a valid salary amount";
    }

    // Check if allocation totals are reasonable (allow some tolerance for rounding)
    const totalAllocation =
      params.needsRatio +
      params.wantsRatio +
      params.investmentRatio +
      params.emergencyFundRatio;

    if (totalAllocation < 0.01) {
      return "Please allocate your income across different categories";
    }

    if (totalAllocation > 1.1) {
      return "Total allocation cannot exceed 100% of your income";
    }

    // Investment ratio should be positive for meaningful analysis
    if (params.investmentRatio <= 0) {
      return "Investment allocation must be greater than 0% for analysis";
    }

    // Check investment breakdown if present
    if (params.investmentBreakdown) {
      const investmentTotal = Object.values(params.investmentBreakdown).reduce(
        (sum, val) => sum + val,
        0
      );
      if (investmentTotal < 0.01 && params.investmentRatio > 0) {
        return "Please allocate your investment amount across different asset classes";
      }
    }

    return null; // Valid
  };

  const handleAnalysis = async (params: AnalysisParams) => {
    // Clear previous error
    setError(null);

    // Validate parameters before making API call
    const validationError = validateParams(params);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      setResults(null);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Analysis failed");
      }

      const data = await response.json();
      setResults(data);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(`Analysis failed: ${errorMessage}`);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Investment Break-Even Analyzer
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Discover when your investment returns will cover all your living
                expenses and achieve true financial independence. Get
                personalized insights and actionable strategies for your
                financial journey.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="metric-card text-center">
                <Calculator className="h-8 w-8 text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Smart Analysis
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Advanced calculations considering inflation, salary growth,
                  and market returns
                </p>
              </div>

              <div className="metric-card text-center">
                <Target className="h-8 w-8 text-success-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Break-Even Point
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Find exactly when your investments will sustain your lifestyle
                </p>
              </div>

              <div className="metric-card text-center">
                <BarChart3 className="h-8 w-8 text-warning-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Multiple Scenarios
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Compare conservative, moderate, and aggressive investment
                  strategies
                </p>
              </div>

              <div className="metric-card text-center">
                <TrendingUp className="h-8 w-8 text-danger-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Visual Insights
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Interactive charts and graphs to visualize your financial
                  future
                </p>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Analysis Form */}
              <div className="lg:col-span-4">
                <div className="card sticky top-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <DollarSign className="h-6 w-6 text-primary-600 mr-2" />
                    Your Financial Profile
                  </h2>
                  <AnalysisForm
                    onAnalysisChange={handleAnalysis}
                    loading={loading}
                  />
                </div>
              </div>

              {/* Results Display */}
              <div className="lg:col-span-8">
                {loading ? (
                  <div className="card text-center">
                    <div className="py-12">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Analyzing Your Financial Data...
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                        Please wait while we calculate your break-even analysis
                        and investment projections.
                      </p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="card text-center">
                    <div className="py-12">
                      <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="h-8 w-8 text-red-600 dark:text-red-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
                        Unable to Complete Analysis
                      </h3>
                      <p className="text-red-600 dark:text-red-300 max-w-md mx-auto mb-4">
                        {error}
                      </p>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-blue-500" />
                          <strong>Tips:</strong>
                        </div>
                        <ul className="list-disc list-inside text-left max-w-sm mx-auto mt-2 space-y-1">
                          <li>
                            Make sure your income allocation adds up to 100%
                          </li>
                          <li>Investment allocation must be greater than 0%</li>
                          <li>
                            Distribute your investment across different asset
                            classes
                          </li>
                          <li>Check that all required fields are filled</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : results ? (
                  <ResultsDisplay results={results} />
                ) : (
                  <div className="card text-center">
                    <div className="py-12">
                      <BarChart3 className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Ready to Analyze Your Financial Future?
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                        Fill out the form on the left with your financial
                        details to get a comprehensive break-even analysis and
                        personalized investment strategy.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
