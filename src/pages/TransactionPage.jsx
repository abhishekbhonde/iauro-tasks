
import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import ExpenseModal from '../components/ExpenseModal';
import AlertModal from '../components/AlertModal';

const TransactionPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [dateFilter, setDateFilter] = useState('all');
  const [deleteAlert, setDeleteAlert] = useState({ isOpen: false, transactionId: null });
  const dropdownRef = useRef(null);
  const transactionsPerPage = 10;
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/expenses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a, b) => 
          sortOrder === 'desc' 
            ? new Date(b.date) - new Date(a.date)
            : new Date(a.date) - new Date(b.date)
        );
        setTransactions(sortedData);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const getFilteredTransactions = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      switch (dateFilter) {
        case 'today':
          return transactionDate.toDateString() === today.toDateString();
        case 'week':
          return transactionDate >= startOfWeek;
        case 'month':
          return transactionDate >= startOfMonth;
        default:
          return true;
      }
    });
  };

const handleEdit = async (updatedData) => {
  try {
    const response = await fetch(`http://localhost:5000/api/expenses/${selectedTransaction._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedData)
    });

    if (response.ok) {
      const updatedTransaction = await response.json();
      setTransactions(transactions.map(t => 
        t._id === updatedTransaction._id ? updatedTransaction : t
      ));
      setIsEditModalOpen(false);
      setSelectedTransaction(null);
    } else {
      throw new Error('Failed to update');
    }
  } catch (err) {
    console.error('Failed to update transaction:', err);
    alert('Failed to update transaction. Please try again.');
  }
};

const handleDelete = async (transactionId) => {
  console.log("Transaction ID to delete:", transactionId); // Debugging step
  try {
    const response = await fetch(`http://localhost:5000/api/expenses/${transactionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      setTransactions(transactions.filter(t => t.transaction_id !== transactionId)); // Correct field name
      setDeleteAlert({ isOpen: false, transactionId: null });
    } else {
      throw new Error('Failed to delete');
    }
  } catch (err) {
    console.error('Failed to delete transaction:', err);
    alert('Failed to delete transaction. Please try again.');
  }
};


  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    const sortedData = [...transactions].sort((a, b) => 
      newOrder === 'desc' 
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );
    setTransactions(sortedData);
  };

  const filteredTransactions = getFilteredTransactions();
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <div className="flex flex-wrap gap-4">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button
              onClick={toggleSortOrder}
              className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors"
            >
              <span>Sort by Date</span>
              <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-sm md:px-6 md:text-base">Date</th>
                  <th className="px-4 py-3 text-left text-sm md:px-6 md:text-base">Category</th>
                  <th className="px-4 py-3 text-left text-sm md:px-6 md:text-base">Description</th>
                  <th className="px-4 py-3 text-right text-sm md:px-6 md:text-base">Amount</th>
                  <th className="px-4 py-3 text-right text-sm md:px-6 md:text-base">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {currentTransactions.map((transaction, index) => (
                  <tr key={transaction.transaction_id} className="text-gray-300 hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-4 text-sm md:px-6 md:text-base">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm md:px-6 md:text-base">{transaction.category}</td>
                    <td className="px-4 py-4 text-sm md:px-6 md:text-base">{transaction.description}</td>
                    <td className={`px-4 py-4 text-sm md:px-6 md:text-base text-right ${
                      transaction.type === 'expense' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {transaction.type === 'expense' ? '-' : '+'} ₹{parseFloat(transaction.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm md:px-6 md:text-base text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === transaction.transaction_id ? null : transaction.transaction_id)}
                          className="text-gray-400 hover:text-white p-1"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>
                        
                        {activeDropdown === transaction.transaction_id && (
                          <div 
                            className="absolute right-0 w-48 rounded-md shadow-lg py-1 bg-gray-700 ring-1 ring-black ring-opacity-5 z-10"
                            style={{
                              bottom: index >= currentTransactions.length - 2 ? '100%' : 'auto',
                              top: index >= currentTransactions.length - 2 ? 'auto' : '100%'
                            }}
                          >
                            <button
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setIsEditModalOpen(true);
                                setActiveDropdown(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeleteAlert({ 
                                  isOpen: true, 
                                  transactionId: transaction.transaction_id 
                                });
                                setActiveDropdown(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center px-4 py-4 border-t border-gray-700">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md bg-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-600"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === index + 1 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md bg-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <AlertModal
        isOpen={deleteAlert.isOpen}
        onClose={() => setDeleteAlert({ isOpen: false, transactionId: null })}
        onConfirm={() => handleDelete(deleteAlert.transactionId)}
        message="Are you sure you want to delete this transaction?"
      />

      {isEditModalOpen && (
        <ExpenseModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTransaction(null);
          }}
          onAddExpense={handleEdit}
          initialData={selectedTransaction}
          isEditing={true}
        />
      )}
    </div>
  );
};

export default TransactionPage;