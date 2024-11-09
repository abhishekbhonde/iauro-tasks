import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Homepage from './pages/Homepage.jsx';
import TransactionPage from './pages/TransactionPage.jsx';
import Analytics from './pages/Analytics.jsx';
import ErrorPage from './pages/ErrorPage.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import LoanPage from './pages/LoanPage.jsx';

const router = createBrowserRouter([ 
  {
  path: "/",
  element:  <Homepage/>
  },
  {
  path: "/transactions",
  element: <TransactionPage/>
  },
  {
    path: "/loans",
    element: <LoanPage/>
  },
  {
    path: "/login",
    element: <Login/>
  },
  {
    path: "/register",
    element: <Register/>
  },
  {
    path: "*",
    element: <ErrorPage/>
  }
]);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
