
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ExpenseChart from '../components/ExpenseChart'
import CategoryChart from '../components/CategoryChart'
import ExpenseModal from '../components/ExpenseModal'
import LoanModal from '../components/LoanModal'

const Homepage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [todayExpense, setTodayExpense] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    if (!token) {
      setExpenses([]);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/expenses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
        calculateExpenses(data);
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    }
  };

  const calculateExpenses = (data) => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    const todayTotal = data
      .filter(expense => expense.date.startsWith(today))
      .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

    const monthlyTotal = data
      .filter(expense => expense.date.startsWith(thisMonth))
      .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

    setTodayExpense(todayTotal);
    setMonthlyExpense(monthlyTotal);
  };

  const handleAddExpenseClick = () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setIsModalOpen(true);
  };

  const handleAddExpense = async (expenseData) => {
    try {
      const response = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(expenseData)
      });
      
      if (response.ok) {
        const newExpense = await response.json();
        const updatedExpenses = [newExpense, ...expenses];
        setExpenses(updatedExpenses);
        calculateExpenses(updatedExpenses);
      }
    } catch (err) {
      console.error('Failed to add expense:', err);
    }
  };

  const handleAddLoan = async (loanData) => {
    try {
      const response = await fetch('http://localhost:5000/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          person_name: loanData.personName,
          amount: parseFloat(loanData.amount),
          type: loanData.type,
          description: loanData.description || 'No description', // Added default
          status: 'active', // Added required field
          due_date: null // Added optional field
        })
      });
        
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error:', errorData);
        throw new Error('Failed to add loan');
      }
  
      const newLoan = await response.json();
      setLoans(prevLoans => [newLoan, ...prevLoans]);
      calculateTotals([newLoan, ...loans]);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to add loan:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8">
        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button 
            onClick={handleAddExpenseClick}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 md:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m-8-6h16" />
            </svg>
            Add Expense
          </button>
          <button
            onClick={() => setIsLoanModalOpen(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 md:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm md:text-base"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v8m0 0v8m0-8h8m-8 0H4" />
            </svg>
             Add Loan
            </button>
        </div>

        {/* Expense Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-bold text-white mb-4">Today's Expenses</h2>
            <p className="text-4xl font-bold text-red-400">₹{todayExpense.toFixed(2)}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-bold text-white mb-4">This Month's Expenses</h2>
            <p className="text-4xl font-bold text-red-400">₹{monthlyExpense.toFixed(2)}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg min-h-[300px]">
            <h2 className="text-2xl font-bold text-white mb-4">Expense Trends</h2>
            <ExpenseChart expenses={expenses} />
          </div>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg min-h-[300px]">
            <h2 className="text-2xl font-bold text-white mb-4">Category Distribution</h2>
            <CategoryChart expenses={expenses} />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Transactions</h2>
          <div className="space-y-4">
            {expenses.slice(0, 5).map((expense) => (
              <div key={expense.transaction_id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-red-500 rounded-full">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{expense.description}</p>
                    <p className="text-gray-400 text-sm">{expense.category}</p>
                  </div>
                </div>
                <span className="text-red-400 font-bold">-₹{parseFloat(expense.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Modal */}
        <ExpenseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddExpense={handleAddExpense}
        />
        <LoanModal
          isOpen={isLoanModalOpen}
          onClose={() => setIsLoanModalOpen(false)}
          onAddLoan={handleAddLoan}
         />
      </main>
    </div>
  );
};

export default Homepage;