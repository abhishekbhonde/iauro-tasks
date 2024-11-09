// src/pages/LoanPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import LoanModal from '../components/LoanModal';
import AlertModal from '../components/AlertModal';

const LoanPage = () => {  
  const [loans, setLoans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [totalToReceive, setTotalToReceive] = useState(0);
  const [totalToGive, setTotalToGive] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [deleteAlert, setDeleteAlert] = useState({ isOpen: false, loanId: null });
  const dropdownRefs = useRef({});

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchLoans();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !dropdownRefs.current[activeDropdown]?.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const fetchLoans = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/loans', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched loans:', data); // Debug log
        setLoans(data);
        calculateTotals(data);
      } else {
        console.error('Failed to fetch loans:', response.status);
      }
    } catch (err) {
      console.error('Failed to fetch loans:', err);
    }
  };

  const calculateTotals = (loansData) => {
    const { toReceive, toGive } = loansData.reduce((acc, loan) => {
      if (loan.type === 'given') {
        acc.toReceive += parseFloat(loan.amount);
      } else {
        acc.toGive += parseFloat(loan.amount);
      }
      return acc;
    }, { toReceive: 0, toGive: 0 });

    setTotalToReceive(toReceive);
    setTotalToGive(toGive);
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
          description: loanData.description || ''
        })
      });
      
      if (response.ok) {
        const newLoan = await response.json();
        setLoans(prevLoans => [newLoan, ...prevLoans]);
        calculateTotals([newLoan, ...loans]);
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to add loan:', err);
     
    }
  };

  const handleEdit = async (updatedData) => {
    try {
      const response = await fetch(`http://localhost:5000/api/loans/${selectedLoan.loan_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          person_name: updatedData.personName,
          amount: parseFloat(updatedData.amount),
          type: updatedData.type,
          description: updatedData.description || 'No description',
          status: selectedLoan.status || 'active', // Preserve existing status
          due_date: selectedLoan.due_date || null // Preserve existing due date
        })
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error:', errorData);
        throw new Error('Failed to update loan');
      }
  
      const editedLoan = await response.json();
      setLoans(prevLoans => prevLoans.map(loan => 
        loan.loan_id === editedLoan.loan_id ? editedLoan : loan
      ));
      calculateTotals(loans);
      setIsEditModalOpen(false);
      setSelectedLoan(null);
    } catch (err) {
      console.error('Failed to update loan:', err);
     
    }
  };

  const handleDelete = async (loanId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/loans/${loanId}`, { // Fixed URL
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete loan');
      }
  
      const updatedLoans = loans.filter(loan => loan.loan_id !== loanId);
      setLoans(updatedLoans);
      calculateTotals(updatedLoans);
      setDeleteAlert({ isOpen: false, loanId: null });
    } catch (err) {
      console.error('Failed to delete loan:', err);
     
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">Loans</h1>
          
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-2">To Receive</h2>
            <p className="text-3xl font-bold text-green-400">₹{totalToReceive.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-2">To Give</h2>
            <p className="text-3xl font-bold text-red-400">₹{totalToGive.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:px-6">Date</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:px-6">Person</th>
                      <th scope="col" className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:px-6">Description</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider md:px-6">Amount</th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider md:px-6">Type</th>
                      <th scope="col" className="relative px-4 py-3 md:px-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {loans.map((loan, index) => (
                      <tr key={loan.loan_id} className="text-gray-300 hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-4 text-sm whitespace-nowrap md:px-6">
                          {new Date(loan.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-sm whitespace-nowrap md:px-6">
                          {loan.person_name}
                        </td>
                        <td className="hidden sm:table-cell px-4 py-4 text-sm whitespace-nowrap md:px-6">
                          {loan.description || '-'}
                        </td>
                        <td className={`px-4 py-4 text-sm whitespace-nowrap text-right md:px-6 ${
                          loan.type === 'given' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          ₹{parseFloat(loan.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 text-sm whitespace-nowrap text-center md:px-6">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            loan.type === 'given' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {loan.type === 'given' ? 'To Receive' : 'To Give'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm whitespace-nowrap text-right md:px-6">
                        <div 
                          className="relative inline-block"
                          ref={el => dropdownRefs.current[loan.loan_id] = el}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === loan.loan_id ? null : loan.loan_id);
                            }}
                            className="text-gray-400 hover:text-white p-1"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </button>
  
                          {activeDropdown === loan.loan_id && (
                           <div 
                             className="absolute z-50"
                             style={{
                                right: 0,
                                ...(index >= loans.length - 2 
                                  ? { bottom: '100%', marginBottom: '0.5rem' }
                                  : { top: '100%', marginTop: '0.5rem' })
                              }}
                            >
                              <div className="bg-gray-700 rounded-md shadow-lg py-1 w-48">
                                <button
                                  onClick={() => {
                                    setSelectedLoan(loan);
                                    setIsEditModalOpen(true);
                                    setActiveDropdown(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteAlert({ isOpen: true, loanId: loan.loan_id });
                                    setActiveDropdown(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LoanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddLoan={handleAddLoan}
      />

      <LoanModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLoan(null);
        }}
        onAddLoan={handleEdit}
        initialData={selectedLoan}
        isEditing={true}
      />

      <AlertModal
        isOpen={deleteAlert.isOpen}
        onClose={() => setDeleteAlert({ isOpen: false, loanId: null })}
        onConfirm={() => handleDelete(deleteAlert.loanId)}
        message="Are you sure you want to delete this loan?"
      />
    </div>
  );
};

export default LoanPage;